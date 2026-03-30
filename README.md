[![Frontend CI/CD](https://github.com/Tati-Vozniuk/focus-pet-frontend/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Tati-Vozniuk/focus-pet-frontend/actions/workflows/ci-cd.yml)

# Focus Pet - Веб-додаток для фокусування з віртуальною твариною

Веб-версія додатку Focus Pet на Java (Spring Boot) + React. Наявні два репозиторії, один для frontend частини, інший для backend. 
Version: Feature2 update + Feature Pt2 update. 
Посилання: https://focus-pet-frontend-5fjk.vercel.app/

## Технології

**Backend:**
- Spring Boot 3.2.1
- Spring Data JPA
- H2 Database
- Lombok
- Maven

**Frontend:**
- React 18.2
- Axios
- CSS3 (Custom styling)

## Встановлення та запуск

### Передумови

Перед запуском переконайтеся, що у вас встановлено:

1. **Java 17 або новіша** 
2. **Maven 3.6+** 
3. **Node.js 16+ та npm** 

Перевірте встановлення:
```bash
java -version
mvn -version
node -version
npm -version
```

### Крок 1: Запуск Backend (Spring Boot)

1. Відкрийте термінал і перейдіть до папки backend:
```bash
cd focus-pet-app/backend
```

2. Зберіть проект:
```bash
mvn clean install
```

3. Запустіть сервер:
```bash
mvn spring-boot:run
```

Сервер запуститься на `http://localhost:8081`

Ви побачите повідомлення:
```
Started FocusPetApplication in X.XXX seconds
```

### Крок 2: Запуск Frontend (React)

1. Відкрийте **новий** термінал і перейдіть до папки frontend:
```bash
cd focus-pet-app/frontend
```

2. Встановіть залежності (тільки при першому запуску):
```bash
npm install
```

3. Запустіть React додаток:
```bash
npm start
```

Додаток автоматично відкриється в браузері на `http://localhost:3000`

## Використання

Після запуску обох серверів:

1. Відкрийте браузер і перейдіть на `http://localhost:3000`
2. Ви побачите головний екран з вашою віртуальною твариною
3. Доступні функції:
   - **Feed [Ім'я тварини]** - годувати тварину (коштує 50 ⍟)
   - **Focus now** - почати сесію фокусування
   - **⚙️** - налаштування (змінити ім'я, тварину, ціль)

