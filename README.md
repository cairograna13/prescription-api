# Sistema de Receituário Digital

Implementação da tarefa em **NestJS + Zod**, com processamento assíncrono de CSV, validação robusta e armazenamento **in-memory**.

## O que foi implementado

- `POST /api/prescriptions/upload`
  - recebe arquivo CSV em `multipart/form-data`
  - responde imediatamente com `upload_id` e status `processing`
  - processa o arquivo em background
- `GET /api/prescriptions/upload/:id`
  - retorna o status atual do processamento
- validações com **Zod**
- armazenamento dos registros válidos em memória
- relatório detalhado de erros por linha/campo
- logs básicos de auditoria com `Logger` do NestJS

## Tecnologias

- Node.js 20+
- NestJS
- Zod
- csv-parse

## Instalação

```bash
npm install
```

## Executar em desenvolvimento

```bash
npm run start:dev
```

A API sobe em:

```bash
http://localhost:3000/api
```

## Endpoints

### Upload do CSV

```http
POST /api/prescriptions/upload
```

```bash
curl.exe -X POST "http://localhost:3000/api/prescriptions/upload" -F "file=@.\exemplo.csv"
```

### Consultar status

```http
GET /api/prescriptions/upload/:id
```

Exemplo:

```bash
curl.exe http://localhost:3000/api/prescriptions/upload/SEU_UPLOAD_ID
```

## Estrutura esperada do CSV

```csv
id,date,patient_cpf,doctor_crm,doctor_uf,medication,controlled,dosage,frequency,duration,notes
1,2024-01-10,12345678901,12345,SP,Paracetamol,false,500mg,8,5,
2,2023-12-05,98765432100,54321,RJ,Ibuprofeno,false,400mg,6,7,
3,2024-02-20,11122233344,99999,MG,Amoxicilina,false,250mg,12,10,
4,2024-03-01,55566677788,77777,RS,Diazepam,true,10mg,24,30,Uso controlado
5,2024-01-15,22233344455,88888,SC,Loratadina,false,10mg,24,15,
6,2023-11-11,33344455566,66666,BA,Omeprazol,false,20mg,24,20,
7,2024-02-01,44455566677,55555,PR,Clonazepam,true,2mg,12,60,Paciente ansioso
8,2024-01-25,66677788899,44444,CE,Metformina,false,850mg,12,90,
9,2023-10-30,77788899900,33333,GO,Losartana,false,50mg,24,30,
10,2024-02-10,88899900011,22222,PE,Codeina,true,30mg,24,10,Dor intensa
```

## Regras de validação implementadas

### Campos obrigatórios

- `id`: obrigatório e único no sistema
- `date`: data válida e não futura
- `patient_cpf`: exatamente 11 dígitos numéricos
- `doctor_crm`: apenas números
- `doctor_uf`: UF válida do Brasil
- `medication`: obrigatório
- `controlled`: boolean; vazio é tratado como `false`
- `dosage`: obrigatório
- `frequency`: número positivo
- `duration`: obrigatório, positivo e máximo de 90 dias

### Regras de negócio

- medicamento controlado exige `notes`
- medicamento controlado deve ter `frequency <= 60`

## Decisão técnica importante sobre `frequency`

O enunciado descreve `frequency` como **número positivo**, mas o CSV de exemplo usa valores como `8/8h` e `12/12h`.

Para acomodar os dois cenários, esta implementação faz o seguinte:

- se vier número puro, usa o número normalmente
- se vier no formato `8/8h`, interpreta como `8`
- se vier `12/12h`, interpreta como `12`

Assim o sistema continua compatível com o CSV fornecido sem ignorar a regra de negócio do desafio.

## Estrutura do projeto

```text
src/
  app.module.ts
  main.ts
  common/
    brazil.ts
  prescriptions/
    interfaces/
      upload-status.interface.ts
    schemas/
      prescription.schema.ts
    prescriptions.controller.ts
    prescriptions.module.ts
    prescriptions.service.ts
    prescriptions.store.ts
```

## Observações

- o armazenamento é **in-memory**, como permitido no desafio
- ao reiniciar a aplicação, uploads e prescrições são perdidos
- o processamento é assíncrono via `setImmediate`, suficiente para a proposta do teste
- o limite atual de upload é **10 MB**

## Melhorias futuras

- persistir em banco de dados
- usar fila real (BullMQ, RabbitMQ, SQS)
- paginação dos erros
- endpoint para consultar prescrições válidas importadas
- testes unitários e de integração
