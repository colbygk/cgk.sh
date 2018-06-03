[![MIT License][license-image]][license-url]

# cgk.sh

## Production

Create/update SSL certificate information, currently fronted by Cloudflare and this is an assumption made in `docker-compose.yml`, with the files `cloudflare.crt` and `cloudflare.key`

```
docker-compose -f production.yml build
docker-compose up
```

## Development

```
cd cgk.sh
docker-compose -f development.yml build
docker-compose -f development.yml up
```

