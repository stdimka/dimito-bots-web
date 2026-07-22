# Dimito Bots — Web

Веб-кабинет multi-user paper SaaS (тот же API, что Android).

**Production:** https://dimito-bots.duckdns.org

## Стек

- Vite + React 19 + TypeScript
- React Router, Zustand, Axios

## Возможности

- Login / Register (JWT), paper start/stop
- Каталог + dashboard overview
- Темы: Mindaro / Dark / Federal
- RU/EN (шапка): описания, strategy guides, логи
- Карточка бота: OHLC-график, маркеры сделок, live logs (WS)
- Глазок пароля, strategy guide как в мобильном

## Deploy (Oracle + Caddy)

```bash
npm run build
# scp dist/* → ~/binance-bots-backend/web/
# Caddy: SPA try_files + reverse_proxy API (см. backend Caddyfile)
```

## Запуск локально

```bash
cd dimito-bots-web
npm install
npm run dev
```

Открой http://localhost:5173

API по умолчанию: `https://dimito-bots.duckdns.org`

Свой backend:

```bash
# .env
VITE_API_URL=http://127.0.0.1:8000
```

## Сборка и деплой на Oracle

```bash
npm run build
# scp dist/* → ubuntu@VM:~/binance-bots-backend/web/
# Caddyfile раздаёт /srv (volume ./web) + reverse_proxy API
docker compose -f docker-compose.saas.yml --profile https up -d caddy
```

## Mindaro palette

| Token        | Hex       |
|-------------|-----------|
| background  | `#FAF6E9` |
| accent card | `#DDEB9D` |
| primary     | `#22333B` |
| border      | `#c5d4a0` |

## Не в MVP

- Push / live trading UI
- Lab / onboarding / charts
- Admin ops / Sentry
- Deploy на Oracle (сделаем по запросу)
