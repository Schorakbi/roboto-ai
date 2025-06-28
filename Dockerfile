
FROM python:3.11-slim


WORKDIR /code

# --- Install system dependencies ---
RUN apt-get update && apt-get install -y

# --- Copy the requirements file ---
COPY ./requirements.txt ./requirements.txt

# --- Install the dependencies ---
RUN pip install --upgrade pip && pip install -r /code/requirements.txt



COPY . /code


EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]