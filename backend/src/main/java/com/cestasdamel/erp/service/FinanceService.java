package com.cestasdamel.erp.service;
import com.cestasdamel.erp.dto.Requests.ManualTransaction; import com.cestasdamel.erp.dto.Responses.*; import com.cestasdamel.erp.model.*; import com.cestasdamel.erp.repository.FinancialTransactionRepository; import lombok.RequiredArgsConstructor; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import java.math.BigDecimal; import java.time.Instant; import java.util.*;
@Service @RequiredArgsConstructor
public class FinanceService {private final FinancialTransactionRepository repo;
 public FinancialTransaction create(Enums.TransactionType type,Enums.TransactionSource source,Long ref,String desc,BigDecimal amount,Instant at){FinancialTransaction f=new FinancialTransaction();f.setType(type);f.setSource(source);f.setReferenceId(ref);f.setDescription(desc);f.setAmount(amount);f.setOccurredAt(at);return repo.save(f);}
 @Transactional public FinancialView manual(ManualTransaction r){return ViewMapper.financial(create(r.type(),Enums.TransactionSource.MANUAL,null,r.description(),r.amount(),r.occurredAt()==null?Instant.now():r.occurredAt()));}
 @Transactional(readOnly=true) public List<FinancialView> list(){return repo.findAllByOrderByOccurredAtDesc().stream().map(ViewMapper::financial).toList();}
 @Transactional(readOnly=true) public BigDecimal balance(){return repo.balance();}
}
