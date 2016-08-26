# recruiter-bot
Recruiter Ninja bot para el Slack de #nardoz

![Recruiter Ninja en acción](/screenshot.png?raw=true "Recruiter Ninja en acción")

## Uso

```bash
npm install
token=xxxxx node index.js
```

## Con Docker

```bash
docker build -t nardoz/recruiter-bot .
docker run -e token=xxxxx nardoz/recruiter-bot
```

## Token

Se obtiene creando un bot en http://my.slack.com/services/new/bot
