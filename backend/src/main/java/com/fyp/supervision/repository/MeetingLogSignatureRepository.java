package com.fyp.supervision.repository;

import com.fyp.supervision.entity.MeetingLogSignature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingLogSignatureRepository extends JpaRepository<MeetingLogSignature, Long> {
    List<MeetingLogSignature> findByMeetingLog_LogId(Long logId);
}
