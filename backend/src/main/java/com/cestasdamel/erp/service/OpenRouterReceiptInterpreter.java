package com.cestasdamel.erp.service;

import com.cestasdamel.erp.exception.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

@Component
public class OpenRouterReceiptInterpreter implements ReceiptInterpreter {
    private static final Set<String> ALLOWED_TYPES = Set.of(
        "image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif", "application/octet-stream");
    private static final long MAX_IMAGE_BYTES = 20L * 1024 * 1024;
    private static final String PROMPT = """
        Analise rapidamente esta foto de nota fiscal brasileira para importar uma compra em um ERP de cestas e cosméticos.
        Transcreva somente informações visíveis; não invente valores. Entenda abreviações comuns de cupom fiscal brasileiro:
        QTD, QT, QDE e QUANT significam quantidade; UN, UND, UNID e PC significam unidade; VL UN, VLR UNIT,
        PRECO UN e UNIT significam custo unitário; VL ITEM, TOTAL ITEM e VL TOTAL significam subtotal.
        CX, Cx e CAIXA significam BOX; PCT, PAC e PACOTE significam PACKAGE; KG, G, ML, L, M e CM são unidades reais.
        Descrições abreviadas devem ser normalizadas com cuidado: CHOC, CHOCOL, BARR CHOC podem virar Chocolate;
        PERF, PERFUM, DESOD COL podem virar Perfume somente quando fizer sentido pelo texto visível.
        Separe quantidade em estoque do conteúdo da embalagem:
        2 perfumes de 100 ml significam quantity=2, inventoryUnit=UNIT, contentQuantity=100 e contentUnit=ML.
        3 barras de chocolate 90 g significam quantity=3, inventoryUnit=UNIT, contentQuantity=90 e contentUnit=G.
        1 fita 10 m significa quantity=10, inventoryUnit=M, contentQuantity=null e contentUnit=null se for material por metro.
        Produtos acabados normalmente usam PRODUCT e estoque UNIT. Insumos usados para montar cestas, como fita por metro,
        papel, palha e laços, usam MATERIAL e a unidade real de controle (M, CM, KG, G, L, ML, UNIT, PACKAGE ou BOX).
        Categorias devem ser simples e comerciais, por exemplo Chocolates, Cosméticos, Perfumes, Embalagens, Fitas,
        Decoração, Papelaria, Alimentos ou Materiais.
        unitCost é o custo de uma unidade informada em quantity; subtotal é quantity multiplicado por unitCost.
        Use confidence entre 0 e 1. Seja direto. Avise somente sobre texto ilegível, totais divergentes ou informações incertas.
        """;

    private final ObjectMapper mapper;
    private final RestClient client;
    private final String apiKey;
    private final String model;
    private final String appUrl;
    private final String appTitle;
    private final JsonNode schema;

    public OpenRouterReceiptInterpreter(ObjectMapper mapper, RestClient.Builder builder,
        @Value("${app.openrouter.api-key:}") String apiKey,
        @Value("${app.openrouter.model:openrouter/free}") String model,
        @Value("${app.openrouter.base-url:https://openrouter.ai/api/v1}") String baseUrl,
        @Value("${app.openrouter.timeout-seconds:180}") long timeoutSeconds,
        @Value("${app.openrouter.app-url:http://localhost:8081}") String appUrl,
        @Value("${app.openrouter.app-title:Cestas da Mel ERP}") String appTitle) {
        this.mapper = mapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.appUrl = appUrl;
        this.appTitle = appTitle;
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));
        this.client = builder.baseUrl(baseUrl).requestFactory(requestFactory).build();
        try {
            this.schema = mapper.readTree(SCHEMA);
        } catch (Exception exception) {
            throw new IllegalStateException("Schema da leitura de notas inválido", exception);
        }
    }

    @Override
    public RawReceipt analyze(MultipartFile image) {
        validate(image);
        if (apiKey.isBlank()) {
            throw new BusinessException("A leitura de notas ainda não foi configurada. Defina OPENROUTER_API_KEY no servidor.");
        }
        try {
            String contentType = normalizeContentType(image);
            String dataUrl = "data:" + contentType + ";base64,"
                + Base64.getEncoder().encodeToString(image.getBytes());
            Map<String, Object> responseFormat = Map.of(
                "type", "json_schema",
                "json_schema", Map.of("name", "receipt_analysis", "strict", true, "schema", schema));
            Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(Map.of(
                    "role", "user",
                    "content", List.of(
                        Map.of("type", "text", "text", PROMPT),
                        Map.of("type", "image_url", "image_url", Map.of("url", dataUrl, "detail", "low"))))),
                "response_format", responseFormat,
                "temperature", 0,
                "max_tokens", 1800,
                "provider", Map.of("require_parameters", true));

            JsonNode response = client.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .header("HTTP-Referer", appUrl)
                .header("X-Title", appTitle)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
            return mapper.readValue(extractOutputText(response), RawReceipt.class);
        } catch (BusinessException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new BusinessException("Não foi possível analisar a nota agora. Verifique a chave e o limite gratuito do OpenRouter.");
        } catch (Exception exception) {
            throw new BusinessException("A IA não conseguiu interpretar esta nota. Tente outra foto, mais nítida e bem enquadrada.");
        }
    }

    private void validate(MultipartFile image) {
        if (image == null || image.isEmpty()) throw new BusinessException("Selecione uma foto da nota fiscal");
        if (image.getSize() > MAX_IMAGE_BYTES) throw new BusinessException("A foto deve ter no máximo 20 MB");
        String contentType = image.getContentType() == null ? "" : image.getContentType().toLowerCase();
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new BusinessException("Use uma imagem de nota fiscal em JPG, PNG, WEBP, HEIC ou HEIF");
        }
    }

    private String normalizeContentType(MultipartFile image) {
        String contentType = image.getContentType() == null ? "" : image.getContentType().toLowerCase();
        if ("image/jpg".equals(contentType) || "application/octet-stream".equals(contentType)) return "image/jpeg";
        return contentType;
    }

    private String extractOutputText(JsonNode response) {
        if (response == null) throw new BusinessException("A IA retornou uma resposta vazia");
        JsonNode choice = response.path("choices").path(0);
        if (choice.isMissingNode() || choice.isNull()) throw new BusinessException("A IA não encontrou dados legíveis na nota");
        if (choice.has("error")) throw new BusinessException("O modelo gratuito não ficou disponível. Tente novamente em instantes");
        String content = choice.path("message").path("content").asText();
        if (content.isBlank()) throw new BusinessException("A IA não encontrou dados legíveis na nota");
        return content;
    }

    private static final String SCHEMA = """
        {"type":"object","properties":{
          "establishment":{"type":["string","null"]},"cnpj":{"type":["string","null"]},"accessKey":{"type":["string","null"]},
          "purchasedAt":{"type":["string","null"],"description":"Data ISO-8601, preferencialmente YYYY-MM-DD"},"total":{"type":["number","null"]},
          "items":{"type":"array","items":{"type":"object","properties":{
            "name":{"type":"string"},"barcode":{"type":["string","null"]},"quantity":{"type":"number"},
            "inventoryUnit":{"type":"string","enum":["UNIT","KG","G","L","ML","M","CM","PACKAGE","BOX"]},
            "contentQuantity":{"type":["number","null"]},"contentUnit":{"type":["string","null"],"enum":["UNIT","KG","G","L","ML","M","CM","PACKAGE","BOX",null]},
            "unitCost":{"type":"number"},"subtotal":{"type":"number"},"suggestedType":{"type":"string","enum":["PRODUCT","MATERIAL"]},
            "categoryName":{"type":"string"},"confidence":{"type":"number","minimum":0,"maximum":1}
          },"required":["name","barcode","quantity","inventoryUnit","contentQuantity","contentUnit","unitCost","subtotal","suggestedType","categoryName","confidence"],"additionalProperties":false}},
          "warnings":{"type":"array","items":{"type":"string"}}
        },"required":["establishment","cnpj","accessKey","purchasedAt","total","items","warnings"],"additionalProperties":false}
        """;
}
