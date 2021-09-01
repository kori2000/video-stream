build:
	docker-compose build
up:
	docker-compose up -d
	sleep 3
	docker logs vs_pod
down:
	docker-compose down