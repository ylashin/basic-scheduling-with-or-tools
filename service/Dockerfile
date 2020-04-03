FROM python:3.8-slim-buster

RUN apt-get update -y

# Development packages
RUN pip install flask flask-cors requests ortools

WORKDIR /app

COPY solver.py solver.py

ENTRYPOINT ["python", "/app/solver.py"]