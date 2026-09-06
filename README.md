# Финансы — Telegram Mini App

Учёт личных доходов и расходов внутри Telegram: баланс, дневной лимит трат,
категории, и автоматическое уведомление от бота при превышении лимита.

## Стек

- Next.js 14 (App Router) + Tailwind CSS
- Supabase (Postgres) — хранилище данных, доступ только с сервера (service role key)
- Telegram Web Apps SDK (`@twa-dev/sdk`) — тема, initData
- Telegram Bot API (`sendMessage`) — уведомления о превышении лимита
- Vercel — хостинг

## Переменные окружения

Смотри `.env.example`. В Vercel добавляются как обычные Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`

## SQL-схема Supabase

Выполнить в Supabase → SQL Editor:

```sql
create table profiles (
  telegram_id bigint primary key,
  username text,
  first_name text,
  daily_limit numeric not null default 0,
  created_at timestamptz not null default now()
);

create table categories (
  id bigserial primary key,
  user_id bigint references profiles(telegram_id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  icon text not null default '💰',
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

create table transactions (
  id bigserial primary key,
  user_id bigint not null references profiles(telegram_id) on delete cascade,
  category_id bigint references categories(id) on delete set null,
  amount numeric not null check (amount > 0),
  type text not null check (type in ('income','expense')),
  note text,
  created_at timestamptz not null default now()
);

-- базовые категории, общие для всех пользователей
insert into categories (user_id, name, type, icon, is_custom) values
  (null, 'Еда', 'expense', '🍔', false),
  (null, 'Транспорт', 'expense', '🚌', false),
  (null, 'Развлечения', 'expense', '🎬', false),
  (null, 'Спорт', 'expense', '🏋️', false),
  (null, 'Здоровье', 'expense', '💊', false),
  (null, 'Покупки', 'expense', '🛍️', false),
  (null, 'Прочее', 'expense', '📦', false),
  (null, 'Зарплата', 'income', '💵', false),
  (null, 'Подарки', 'income', '🎁', false),
  (null, 'Прочее', 'income', '📈', false);
```

Row Level Security можно не включать: все запросы к базе идут только с
сервера (API-роуты Next.js) через service role key, обычный ключ (anon)
в клиенте не используется вовсе.

## Как это работает

- Все страницы — React-компоненты, тема (цвета) берётся из
  `Telegram.WebApp.themeParams`, поэтому приложение подстраивается под
  светлую/тёмную тему Telegram автоматически.
- Каждый запрос к API отправляет `initData` — Telegram сам подписывает эту
  строку, а сервер проверяет подпись (`lib/verifyTelegram.ts`) с помощью
  токена бота. Так сервер точно знает, какой Telegram-пользователь сделал
  запрос, без отдельной регистрации/пароля.
- При добавлении расхода (`app/api/transactions/route.ts`) сервер
  пересчитывает сумму трат за сегодня и, если она превысила
  `daily_limit`, отправляет сообщение через Telegram Bot API
  (`sendMessage`) в чат пользователя с ботом.
