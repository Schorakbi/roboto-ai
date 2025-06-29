# Logistics Command Parser & MLOps Pipeline

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/release/python-311/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Azure](https://img.shields.io/badge/azure-%230072C6.svg?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/)

An end-to-end MLOps project demonstrating the implementation and automated operation of an AI-powered logistics command parsing service. This system uses a Large Language Model (LLM) to interpret natural language commands and translates them into structured JSON data for robotic automation systems. The entire application is deployed on Microsoft Azure via a complete CI/CD pipeline.

---

## 🚀 Live Demo & Video Walkthrough

https://github.com/user-attachments/assets/968fe932-ef8d-4e72-ad81-ee3f85d6bff0




(https://imgur.com/a/O9el0RE)

---

## 🌟 Core Features

- **Natural Language Processing (NLP):** Leverages an LLM (GPT-4.1-mini) to parse complex, human-like commands.
- **Structured JSON Output:** Converts ambiguous text into a machine-readable JSON format, perfect for robotic process automation.
- **Robust Error Handling:** The AI can identify and flag commands that are nonsensical or outside its operational scope.
- **Automated MLOps Pipeline:** A complete CI/CD pipeline on Azure DevOps automates testing, containerization, and deployment.
- **Scalable Cloud Deployment:** The application is containerized with Docker and deployed on Azure Kubernetes Service (AKS) for high availability and scalability.
- **Interactive Frontend:** A React-based UI provides a user-friendly interface to interact with the AI backend and visualize the robot's actions.

---

## 🛠️ Tech Stack & Architecture

This project demonstrates proficiency across the full MLOps lifecycle, from AI development to automated cloud deployment.

### Technology Used

| Category | Technology |
| :--- | :--- |
| **AI & Backend** | Python 3.11, FastAPI, OpenAI API, LangChain (conceptual), Pydantic |
| **Frontend** | React, JavaScript, TailwindCSS |
| **MLOps & CI/CD** | **Microsoft Azure DevOps Pipelines**, Git |
| **Cloud & Deployment**| **Microsoft Azure** (AKS, ACR, App Service), Docker, Kubernetes |

### System Architecture

The architecture is designed for automation and scalability. Every `git push` to the main branch triggers the CI/CD pipeline, ensuring the latest stable version of the AI model is always deployed.



---

## ⚙️ Local Development Setup

To run this project on your local machine, follow these steps:

### Prerequisites

- Python 3.11+
- Docker Desktop
- An OpenAI API Key

### Installation & Execution

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/lexx-mlops-project.git
    cd lexx-mlops-project
    ```

2.  **Create and configure the environment file:**
    Create a file named `.env` in the root directory and add your API key:
    ```
    OPENAI_API_KEY="sk-YourSecretOpenAI_API_KeyGoesHere"
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the FastAPI backend locally:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The API will be available at `http://127.0.0.1:8000`.

5.  **(Optional) Run the entire application in Docker:**
    First, build the Docker image:
    ```bash
    docker build -t logistics-parser-api .
    ```
    Then, run the container, passing the environment file:
    ```bash
    docker run --rm -p 8000:8000 --env-file .env logistics-parser-api
    ```

---

## 🧪 API Endpoint Example

You can test the running API using `curl`.

**Endpoint:** `POST /parse-command`

**Request Body:**
```json
{
  "command": "Please get 3 boxes of part #A-123 from shelf B4 and move them to assembly station 2."
}
Use code with caution.
Markdown
cURL Command:
Generated bash
curl -X 'POST' \
  'http://127.0.0.1:8000/parse-command' \
  -H 'Content-Type: application/json' \
  -d '{
    "command": "Please get 3 boxes of part #A-123 from shelf B4 and move them to assembly station 2."
  }'
