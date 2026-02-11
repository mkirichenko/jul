package com.jul.backend.kafka;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.annotation.PreDestroy;
import java.util.List;

@Service
public class EventSenderService {

    private static final Logger log = LoggerFactory.getLogger(EventSenderService.class);

    private final KafkaProducer<String, byte[]> producer;

    public EventSenderService(KafkaProducer<String, byte[]> producer) {
        this.producer = producer;
    }

    public void sendEvents(String topic, List<byte[]> events) {
        sendEvents(topic, null, events);
    }

    public void sendEvents(String topic, String key, List<byte[]> events) {
        if (events == null || events.isEmpty()) {
            return;
        }
        log.debug("Submitting {} events to topic={}", events.size(), topic);
        for (byte[] event : events) {
            producer.send(new ProducerRecord<>(topic, key, event), (metadata, exception) -> {
                if (exception != null) {
                    log.error("Failed to send event to topic={}: {}", topic, exception.getMessage(), exception);
                } else {
                    log.debug("Event sent to topic={} partition={} offset={}", metadata.topic(), metadata.partition(), metadata.offset());
                }
            });
        }
    }

    @PreDestroy
    public void close() {
        log.info("Closing Kafka producer");
        producer.close();
    }
}
