# Budget API - Clean Architecture

## Visão Geral

A API de Budget foi refatorada seguindo os princípios de **Clean Architecture** para garantir:

- **Separação de Responsabilidades**: Cada camada tem uma função específica
- **Testabilidade**: Código desacoplado facilita testes unitários
- **Manutenibilidade**: Estrutura organizada facilita evolução do código
- **Princípios SOLID**: Código extensível e de fácil manutenção

## Estrutura de Diretórios

```
app/api/budget/
├── domain/                    # Regras de negócio
│   ├── entities/             # Entidades do domínio
│   │   └── BudgetConfig.ts
│   └── repositories/         # Interfaces dos repositórios
│       └── IBudgetRepository.ts
│
├── application/              # Casos de uso
│   └── use-cases/
│       ├── GetBudgetUseCase.ts
│       ├── CreateBudgetUseCase.ts
│       └── UpdateBudgetUseCase.ts
│
├── infrastructure/           # Implementações técnicas
│   └── repositories/
│       └── SupabaseRepositories.ts
│
├── presentation/             # Camada de apresentação
│   └── controllers/
│       └── BudgetController.ts
│
├── helpers.ts               # Funções auxiliares
└── route.ts                 # Handlers HTTP (Next.js)
```

## Camadas da Arquitetura

### 1. Domain (Domínio)

**Responsabilidade**: Definir as entidades e contratos (interfaces) do negócio.

- **Entities**: Representam os conceitos principais do domínio
  - `BudgetConfig`, `Income`, `FixedExpense`, `CreditCard`, `DailyExpense`

- **Repositories (Interfaces)**: Definem contratos para acesso a dados
  - `IBudgetRepository`
  - `IIncomeRepository`
  - `IFixedExpenseRepository`
  - `ICreditCardRepository`
  - `IDailyExpenseRepository`

**Princípio**: Esta camada não depende de nenhuma outra. É o núcleo da aplicação.

### 2. Application (Aplicação)

**Responsabilidade**: Implementar os casos de uso (regras de aplicação).

- **Use Cases**: Orquestram o fluxo de negócio
  - `GetBudgetUseCase`: Busca configuração do orçamento
  - `CreateBudgetUseCase`: Cria novo orçamento
  - `UpdateBudgetUseCase`: Atualiza orçamento existente

**Princípio**: Depende apenas da camada de Domínio (interfaces). Não conhece detalhes de implementação.

### 3. Infrastructure (Infraestrutura)

**Responsabilidade**: Implementar os detalhes técnicos.

- **Repositories (Implementações)**: Comunicação com banco de dados
  - `SupabaseBudgetRepository`
  - `SupabaseIncomeRepository`
  - `SupabaseFixedExpenseRepository`
  - `SupabaseCreditCardRepository`
  - `SupabaseDailyExpenseRepository`

**Princípio**: Implementa as interfaces definidas no Domínio. Detalhes de como os dados são armazenados/recuperados.

### 4. Presentation (Apresentação)

**Responsabilidade**: Receber requisições e orquestrar casos de uso.

- **Controllers**: Manipulam HTTP requests/responses
  - `BudgetController`: Orquestra GET, POST, PUT

**Princípio**: Traduz requisições HTTP em comandos para os casos de uso.

## Fluxo de Dados

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────┐
│  route.ts   │ (Next.js handler)
└──────┬──────┘
       │ Chama controller
       ▼
┌─────────────┐
│ Controller  │ (Presentation)
└──────┬──────┘
       │ Executa use case
       ▼
┌─────────────┐
│  Use Case   │ (Application)
└──────┬──────┘
       │ Usa repositories
       ▼
┌─────────────┐
│ Repository  │ (Infrastructure)
└──────┬──────┘
       │ Acessa Supabase
       ▼
┌─────────────┐
│  Database   │
└─────────────┘
```

## Exemplo de Uso

### GET /api/budget

```typescript
// 1. Route handler (route.ts)
export async function GET(request: Request) {
  // Auth
  const user = await getUser();
  
  // Criar repositórios
  const repositories = await createRepositories();
  
  // Criar controller
  const controller = new BudgetController(
    repositories.budgetRepository,
    repositories.incomeRepository,
    repositories.expenseRepository,
    repositories.creditCardRepository,
    repositories.dailyExpenseRepository,
  );
  
  // Delegar para controller
  return await controller.getBudget(user.id, month, year);
}

// 2. Controller (BudgetController.ts)
async getBudget(userId: string, month: number, year: number) {
  const useCase = new GetBudgetUseCase(
    this.budgetRepository,
    this.incomeRepository,
    this.expenseRepository,
    this.creditCardRepository,
    this.dailyExpenseRepository,
  );
  
  const result = await useCase.execute({ userId, month, year });
  return NextResponse.json(result);
}

// 3. Use Case (GetBudgetUseCase.ts)
async execute(request: GetBudgetRequest): Promise<BudgetConfigResponse> {
  // Buscar configuração
  const config = await this.budgetRepository.findByUserAndMonth(
    userId,
    monthId,
  );
  
  // Buscar dados relacionados
  const incomes = await this.incomeRepository.findByUserAndMonth(...);
  const expenses = await this.expenseRepository.findByUserAndMonth(...);
  
  // Calcular métricas e retornar
  return { ...config, incomes, expenses, metrics };
}

// 4. Repository (SupabaseBudgetRepository.ts)
async findByUserAndMonth(userId: string, monthId: string) {
  const { data } = await this.supabase
    .from("monthly_budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("month_id", monthId)
    .single();
  
  return data;
}
```

## Benefícios da Arquitetura

### 1. Testabilidade

Cada camada pode ser testada isoladamente usando mocks:

```typescript
describe("GetBudgetUseCase", () => {
  it("should return budget configuration", async () => {
    // Mock repositories
    const mockBudgetRepo = {
      findByUserAndMonth: jest.fn().mockResolvedValue(mockConfig),
    };
    
    const useCase = new GetBudgetUseCase(
      mockBudgetRepo,
      mockIncomeRepo,
      // ...
    );
    
    const result = await useCase.execute({ userId, month, year });
    
    expect(result).toMatchObject(expected);
  });
});
```

### 2. Substituição de Infraestrutura

É fácil trocar Supabase por outro banco sem afetar a lógica de negócio:

```typescript
// Trocar de Supabase para Prisma, MongoDB, etc.
const repositories = {
  budgetRepository: new PrismaBudgetRepository(prisma),
  // Resto permanece igual
};
```

### 3. Manutenibilidade

- Mudanças na API HTTP (route.ts) não afetam lógica de negócio
- Mudanças no banco de dados ficam isoladas nos repositories
- Casos de uso podem ser reutilizados em diferentes contextos (CLI, Jobs, etc.)

### 4. Princípios SOLID

- **Single Responsibility**: Cada classe tem uma única responsabilidade
- **Open/Closed**: Extensível via interfaces sem modificar código existente
- **Liskov Substitution**: Implementações podem ser substituídas
- **Interface Segregation**: Interfaces específicas e focadas
- **Dependency Inversion**: Depende de abstrações, não de implementações

## Próximos Passos

1. **Adicionar Testes Unitários**
   - Testar use cases com repositories mockados
   - Testar repositories com banco de dados de teste

2. **Validação de Input**
   - Adicionar Zod schemas nos controllers
   - Validar payloads antes de chamar use cases

3. **Tratamento de Erros**
   - Criar classes de erro customizadas
   - Mapear erros do domínio para HTTP status codes

4. **Logging e Observabilidade**
   - Adicionar logging estruturado
   - Métricas de performance

5. **Documentação da API**
   - OpenAPI/Swagger spec
   - Exemplos de requisição/resposta

## Referências

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
