# 架构与工业级 Java 后端：互动课程材料集

> 面向已掌握 Java、SQL、Spring、Hibernate 基础，希望学会开发、部署、维护真实应用并能在面试中清晰解释技术决策的开发者。以订单服务为贯穿案例。

---

## 第一部分：核心结论（先读这个）

### 何时选微服务，何时不选

**模块化单体优先，微服务是延迟决策。** 在领域边界尚不清晰、团队规模小于 10 人、部署流水线未成熟时，微服务带来的分布式复杂度（网络延迟、部分失败、数据一致性、可观测性）会超过其收益。Martin Fowler 明确建议“MonolithFirst”：先用模块化单体快速验证领域模型，仅在特定模块出现独立的伸缩需求或团队自治需求时再拆分。Gartner 社区的实际案例显示，已有团队因并发问题和运维复杂度从微服务回退到单体。

**微服务的真实触发条件：** 领域边界已稳定；不同模块的负载特征差异显著；多个团队需要独立部署节奏；组织已具备容器编排、服务发现、集中式可观测性的能力。

### Kafka vs RabbitMQ：场景决定选择

实验数据表明：RabbitMQ 更适合低延迟的个体消息投递和复杂路由场景；Kafka 在极限吞吐量和持续高负载下的稳定性更强。订单服务的事件流（如 `OrderCreated` 需要被支付、库存、通知等多个消费者独立消费）天然适合 Kafka 的 consumer group 模型。如果仅是任务队列（如发送邮件），RabbitMQ 的 per-message ack 和复杂路由更直接。

### 最容易被面试官追问的要点

- Circuit Breaker 的 fallback 如果“撒谎”（返回库存充足但实际未知），比直接报错更危险。
- Kafka 的“精确一次”需要事务性 producer + 读-处理-写事务，Spring Kafka 3.0+ 仅支持 EOSMode.V2。
- 死锁的根因通常是“加锁顺序不一致”，而不是锁本身太多。PostgreSQL 的死锁检测在 `deadlock_timeout` 后触发，会终止其中一个事务。


## 第二部分：最小完整项目——订单服务

### 系统边界

单体起步，内含三个模块：`order`、`payment`、`inventory`。通过包结构和接口显式隔离边界。对外暴露 REST API（创建订单），内部通过 Spring Events 解耦模块，对下游通过 Kafka 发布 `OrderCreated`。部署到 Kubernetes，用 Prometheus + Grafana 观测。

### 技术选型（按引入顺序）

| 阶段 | 技术 | 引入理由 |
|------|------|---------|
| 1 | Spring Boot 3.x + PostgreSQL | 基础 CRUD 和事务 |
| 2 | Spring Kafka | 发布 `OrderCreated` 事件 |
| 3 | Docker Compose | 本地一键拉起 PG + Kafka |
| 4 | Kubernetes (Deployment + Service) | 容器编排 |
| 5 | Prometheus + Grafana | 指标采集与展示 |
| 6 | Resilience4j | 外部支付调用保护 |

### 贯穿的失败场景

**场景：** 创建订单时，数据库写入成功但 Kafka 发送失败（应用崩溃）。订单存在但支付服务永远收不到事件。

**诊断路径：** 检查日志中的 `KafkaProducerException`；确认数据库中有 order 记录；确认 Kafka topic 中没有对应 offset。

**修复：** 引入 Transactional Outbox——在同一个数据库事务中写入 `outbox_events` 表，后台 poller 读取未发送事件并投递到 Kafka。


## 第三部分：实践任务（5 个）

### 任务 1：模块化单体的边界划分

**输入条件：** 一个包含 `OrderService`、`PaymentService`、`InventoryService` 的 Spring Boot 应用，所有类在同一个包中。

**任务：** 重构为三个包：`com.example.order`、`com.example.payment`、`com.example.inventory`。禁止跨包直接访问对方的 Repository。`OrderService` 只能通过 `InventoryClient` 接口调用库存检查。

**预期结果：** 编译通过；包间依赖通过 ArchUnit 测试验证（可选）；后续可以将 `inventory` 包整体抽取为独立服务而不改业务逻辑。

**典型错误：** 仅创建包结构但仍通过 `@Autowired` 注入对方的 `Repository`。这会破坏边界意图。


### 任务 2：Kafka Consumer Group 与分区分配

**输入条件：** Topic `orders.created`，4 个分区。启动 2 个消费者实例，然后增加到 3 个，再杀掉其中一个。

**任务：** 用 `kafka-consumer-groups.sh --describe` 记录每次变化后的分区分配。

**预期结果：** 2 个消费者 → 各 2 分区；3 个消费者 → 2/1/1 分配；杀掉一个 → 剩余 2 个重新分配，第三个消费者可能空闲。

**典型错误：** 认为增加消费者总是提升吞吐。实际上 rebalance 期间消费暂停，且分区数上限决定了消费者并行度的理论上限。


### 任务 3：PostgreSQL 死锁复现

**输入条件：** 表 `accounts(id, amount)`，两行数据。

**任务：** 打开两个 psql 会话。会话 A：`BEGIN; UPDATE accounts SET amount = amount - 100 WHERE id = 1;`。会话 B：`BEGIN; UPDATE accounts SET amount = amount - 10 WHERE id = 2;`。然后会话 A：`UPDATE accounts SET amount = amount + 100 WHERE id = 2;`。会话 B：`UPDATE accounts SET amount = amount + 10 WHERE id = 1;`。

**预期结果：** 其中一个会话收到 `ERROR: deadlock detected`，另一个成功提交。

**典型错误：** 认为死锁是“两个事务同时写同一行”。实际上是两个事务以不同顺序获取**不同的**行锁，形成循环等待。


### 任务 4：Transactional Outbox 的集成测试

**输入条件：** Spring Boot 应用，包含 `OrderRepository` 和 `KafkaTemplate`。

**任务：** 编写集成测试：调用 `createOrder()` 后，模拟应用在 `repository.save()` 之后、`kafkaTemplate.send()` 之前崩溃。验证订单已保存但 Kafka 无消息。然后实现 Outbox 模式，重新运行测试。

**预期结果：** 引入 Outbox 后，即使发送失败，事件记录仍在 `outbox_events` 表中，后台 poller 会最终投递。

**典型错误：** 试图将 `kafkaTemplate.send()` 放入 JPA 事务中。Kafka 不参与 JPA 事务，这个组合不能提供原子性。


### 任务 5：Prometheus 告警规则编写

**输入条件：** 应用暴露 `/actuator/prometheus`，指标 `http_server_requests_seconds_bucket` 可用。

**任务：** 编写 Prometheus 告警规则：当 p95 延迟超过 1 秒持续 5 分钟时触发 warning；当 5xx 错误率超过 5% 持续 5 分钟时触发 critical。

**预期结果：** 规则通过 `promtool check rules` 验证；在 Grafana 中手动触发后 Alertmanager 收到通知。

**典型错误：** 使用平均值而非分位数。平均值会掩盖长尾用户的体验。参考已有的 Mirador 告警规则： 中定义了 `MiradorHighLatencyP95` 使用 `histogram_quantile(0.95, ...)`。


## 第四部分：填补的空白——每个主题的最小可操作材料

### 4.1 模块化单体 vs 微服务：决策清单

**判断维度：** 领域边界是否稳定（频繁变更 → 单体）；团队是否超过 10 人（是 → 考虑拆分）；部署频率是否因模块而异（是 → 微服务有收益）；是否已有 Kubernetes + 可观测性基础设施（否 → 先建基础设施）。

**关键原则：** 模块化单体的核心不是“一个可执行文件”，而是**显式的模块边界和受限的依赖方向**。如果一个单体内部可以按包强制约束调用关系，它已经具备了未来拆分微服务的组织前提。

### 4.2 Kafka vs RabbitMQ：场景化对比

| 场景 | 推荐 | 理由 |
|------|------|------|
| 订单事件被 3 个下游独立消费，各自进度不同 | Kafka | consumer group 天然支持多订阅者独立 offset |
| 发送一封欢迎邮件，失败后重试 3 次入 DLT | RabbitMQ | per-message ack + dead-letter exchange 更简单 |
| 每秒 10 万条日志采集 | Kafka | 高吞吐顺序写 |
| 请求-响应式的 RPC 替代（带超时和取消） | RabbitMQ | 直接 reply-to 队列语义 |
| 需要回放历史事件重建状态 | Kafka | 保留策略 + 任意 offset seek |

来源：一项在 Docker 控制环境下对两种 broker 的实验对比。

### 4.3 Kafka 精确一次：Spring Kafka 的实际约束

Spring Kafka 3.0+ 仅支持 `EOSMode.V2`（fetch-offset-request fencing）。配置方式：为 `KafkaTemplate` 和监听器容器提供同一个 `KafkaAwareTransactionManager`。监听器抛异常 → 事务回滚 → 消费者重新定位到未提交的 offset。需要 broker 版本 ≥ 2.5。

**限制：** “精确一次”仅保证 `读→处理→写` 这个序列。如果写的是外部系统（HTTP API），不在事务内，仍然可能重复。

### 4.4 死锁诊断：pg_locks 与加锁顺序

PostgreSQL 的死锁检测在 `deadlock_timeout`（默认 1s）后触发，构建等待图并查找环。发现环后终止其中一个事务。诊断查询示例（来自邮件列表的经典方案）：

```sql
SELECT pl.pid as process_id, pc.relname as relation_name, 
       pl.granted as lock_status, pl.locktype
FROM pg_class pc, pg_locks pl
WHERE pc.oid = pl.relation AND pl.pid IN (pid1, pid2);
```

**根因模式：** 事务 A 更新行 1 然后尝试行 2；事务 B 更新行 2 然后尝试行 1。修复方式是**统一加锁顺序**。

### 4.5 VACUUM、WAL 与分区：为什么删除很昂贵

PostgreSQL 的 `DELETE` 不立即移除数据，而是标记为 dead tuple，并写入 WAL。高频率删除导致 WAL 量激增、autovacuum 无法跟上、表膨胀。对于时间序列数据（如订单日志），**分区表 + DETACH PARTITION** 比逐行 DELETE 快几个数量级：分区操作是元数据操作，毫秒级完成，不产生逐行 WAL 和 dead tuple。

**监控查询：**
```sql
SELECT relname, n_dead_tup, last_autovacuum, autovacuum_count
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000000;
```

### 4.6 Kubernetes 部署：GitOps 与 Helm 的最小路径

**从提交到部署的流水线：** GitHub Actions 构建镜像并推送到 Registry → 更新 Helm chart 的 image tag → Argo CD 检测到 Git 仓库变化 → 自动同步到集群。

**Argo CD 的核心价值：** drift detection。如果有人在集群中手动修改了 Deployment，Argo CD 显示 `OutOfSync`，开启 self-heal 后自动恢复。这提供了一个可交互的教学模型。

### 4.7 可观测性闭环：从告警到根因

**完整路径（参考 OpenTelemetry Demo 的模式）：**

1. **告警：** Prometheus 规则 `MiradorHighLatencyP95` 触发（p95 > 1s 持续 10 分钟）。
2. **指标：** Grafana 显示延迟集中在 `GET /customers/aggregate` 端点。
3. **Trace：** Jaeger 中查看慢请求的 waterfall，发现 200ms 的固定 sleep 是设计行为，但如果延迟远超预期，查看下游 span。
4. **日志：** 用 traceId 关联日志，发现 `cache_hit=false` 反复出现。
5. **根因：** 缓存失效或缓存未预热。
6. **修复：** 调整缓存策略或增加缓存容量。

**Kafka Lag 告警规则示例**（来自真实项目的 Prometheus 配置）：

```yaml
- alert: MiradorKafkaConsumerLagHigh
  expr: max(kafka_consumer_fetch_manager_records_lag{job=~"mirador.*"}) > 1000
  for: 5m
  annotations:
    summary: "Kafka consumer lag > 1000 for 5 min"
```

告警分级策略参考：积压 > 5k 且 < 10k 为轻微，> 10k 为严重；延迟 p95 > 30s 轻微，p99 > 2min 严重。

### 4.8 OAuth2/OIDC 与 Spring Security

**角色映射模式：** Keycloak 的 `realm_access.roles` 或 `resource_access.<client>.roles` 需要映射到 Spring Security 的 `GrantedAuthority`。参考实现中使用自定义 `CustomJwtAuthenticationConverter`。Spring 配置示例：

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          authority-prefix: "ROLE_"
          authorities-claim-expressions: "['resource_access']['${client-id}']['roles']"
```

**面试要点：** OAuth2/OIDC 只定义认证，不定义授权。应用层的授权（`@PreAuthorize`、`hasRole`）由 Spring Security 在资源服务器端执行。

### 4.9 Circuit Breaker 与 Retry 的正确组合

Resilience4j 的注解顺序很重要：默认 Retry 包裹 CircuitBreaker，意味着每次重试都被 breaker 计数。Fallback 方法签名必须与原方法一致（参数 + 可选 `Throwable`），否则运行时失败。

**最危险的错误：** Fallback 返回“库存充足”而实际库存未知。这会导致超卖。正确做法是返回 `StockLevel.unknown(sku)`，让调用方决定是拒绝还是异步处理。

### 4.10 Saga：编排 vs 协作

**协作（Choreography）：** 每个服务监听事件并发布自己的事件。适合 2–4 步的简单流程，耦合松散但流程隐式，调试困难。

**编排（Orchestration）：** 中心 orchestrator 发送命令并接收回复。流程显式，适合分支和补偿步骤较多的场景，但 orchestrator 成为关键依赖。

**订单 Saga 的补偿链：** 创建订单（PENDING）→ 扣减库存失败 → 取消订单。如果支付已成功，补偿是退款。每一步补偿必须幂等。


## 第五部分：互动教学模型设计

| 主题 | 学生操作 | 观察结果 | 结论 |
|------|---------|---------|------|
| **Kafka 分区路由** | 改变 key（null / userId / orderId） | 消息在 4 个分区中的分布 | 同 key 同分区，保证局部顺序 |
| **Saga 补偿链** | 选择在哪一步注入失败（payment / inventory） | 补偿按逆序执行 | 补偿必须幂等且按反序 |
| **死锁构造** | 改变两个事务的 UPDATE 顺序 | 是否触发 deadlock | 加锁顺序不一致是根因 |
| **Circuit Breaker 阈值** | 调整 failure-rate-threshold | fallback 触发时机 | 过早熔断影响可用性，过晚失去保护 |
| **Prometheus 告警** | 调整 `for` 持续时间和阈值 | 告警是否触发 | 过短导致噪声，过长导致漏报 |
| **Hibernate N+1** | EAGER vs LAZY vs JOIN FETCH | 生成的 SQL 数量 | LAZY 必须配合 fetch join 或 batch |


## 第六部分：仍存在的材料缺口（需自行编写）

| 缺口 | 为什么没有现成材料 | 建议方案 |
|------|------------------|---------|
| **订单服务的完整端到端代码** | 开源项目多为片段或过于复杂 | 基于 Spring Initializr 从零搭建，每个阶段一个 commit |
| **Kubernetes 故障注入实验** | 大多是演示而非可操作的实验 | 用 `kubectl exec` 杀掉进程、模拟 OOM、修改 ConfigMap 触发失败 |
| **Redis 缓存一致性场景** | 搜索结果中无操作性的 PG+Redis 案例 | 编写 Cache-Aside 与 Write-Through 的对比实验 |
| **Testcontainers 集成测试模板** | 有提及但无完整可运行代码 | 提供 `@Testcontainers` + `@ServiceConnection` 的 PG/Kafka 模板 |
| **面试问题与参考答案** | 搜索结果中无直接匹配的内容 | 基于上述每个失败场景编写“你在生产中遇到过什么最难排查的 bug？”类问题 |


**使用建议：** 将本文档作为内容骨架交给代码生成代理。优先实现第四部分的 10 个最小可操作材料，每个材料对应一个 Markdown 章节 + 代码片段 + 一个实践任务。互动模型从 Kafka 分区路由和死锁构造开始——这两个最容易可视化和参数化。
