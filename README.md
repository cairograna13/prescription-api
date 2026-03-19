# Prescription API com uma arquitetura mais desenvolvida

Implementação da tarefa em **NestJS + Zod**, com processamento assíncrono de CSV, validação robusta e armazenamento **in-memory**, feita utilizando todos os recursos disponíveis.

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
1,2024-01-10,16959478006,12345,SP,Paracetamol,false,500mg,8,5,
2,2023-12-05,88803817093,54321,RJ,Ibuprofeno,false,400mg,6,7,
3,2024-02-20,47595882052,99999,MG,Amoxicilina,false,250mg,12,10,
4,2024-03-01,59301479060,77777,RS,Diazepam,true,10mg,24,30,Uso controlado
5,2024-01-15,58187021039,88888,SC,Loratadina,false,10mg,24,15,
6,2023-11-11,70094117004,66666,BA,Omeprazol,false,20mg,24,20,
7,2024-02-01,72564642071,55555,PR,Clonazepam,true,2mg,12,60,Paciente ansioso
8,2024-01-25,03489862031,44444,CE,Metformina,false,850mg,12,90,
9,2023-10-30,14016441048,33333,GO,Losartana,false,50mg,24,30,
1,2024-02-10,42969777096,22222,PE,Codeina,true,30mg,24,10,Dor intensa
RX001,2024-01-15,64082418083,123456,SP,Dipirona Sódica,false,500mg,8/8h,7,Tomar após as refeições
RX002,2024-01-16,36591805052,789012,RJ,Amoxicilina,false,875mg,12/12h,10,
RX003,2024-01-17,13409340009,123456,SP,Lorazepam,true,1mg,12/12h,30,1cp as 7h e as 19h
```

## Regras de validação implementadas

### Campos obrigatórios

- `id`: obrigatório e único no sistema
- `date`: data válida e não futura
- `patient_cpf`: cpf válido apenas 11 digitos numericos
- `doctor_crm`: apenas números
- `doctor_uf`: UF válida do Brasil
- `medication`: obrigatório
- `controlled`: boolean; vazio é tratado como `false`
- `dosage`: obrigatório
- `frequency`: número positivo e aceita o padrão que estava como exemplo tambem (8/8h)
- `duration`: obrigatório, positivo e máximo de 90 dias

### Regras de negócio

- medicamento controlado exige `notes`
- medicamento controlado deve ter `frequency <= 60`

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

- o armazenamento é **in-memory**
- ao reiniciar a aplicação, uploads e prescrições são perdidos
- o processamento é assíncrono via `setImmediate`
- o limite atual de upload é **10 MB**