import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import AzureOpenAI
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

endpoint = "https://schor-mcg3c944-eastus2.cognitiveservices.azure.com/"
model_name = "o4-mini"
deployment = "o4-mini"


subscription_key = os.environ["AZURE_OPENAI_KEY"]
api_version = "2025-01-01-preview"


# --- Initialize FastAPI and OpenAI Client ---
app = FastAPI(
    title="Logistics Command Parser API",
    description="An API to parse natural language commands for logistics robots into structured JSON.",
    version="0.1.0"
)

# Enable CORS for local development
# This allows the frontend to communicate with the backend during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Initialize Azure OpenAI Client
client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=endpoint,
    api_key=subscription_key,
)
# --- Pydantic Models for Request and Response ---
class CommandRequest(BaseModel):
    command: str

class ParsedCommandResponse(BaseModel):
    action: str
    quantity: int | None = None
    item_id: str | None = None
    source: str | None = None
    destination: str | None = None
    valid_command: bool

# --- The Core Prompt for the LLM (Prompt Engineering) ---
# This prompt is crucial. It tells the LLM exactly how to behave.
PROMPT_TEMPLATE = """
You are an expert logistics command interpreter for an autonomous mobile robot. 
Your task is to parse a user's natural language command into a structured JSON object.

The required JSON fields are: "action", "quantity", "item_id", "source", "destination", "valid_command".

Possible actions are: "MOVE", "GET", "DELIVER", "CHARGE", "UNKNOWN".

Rules:
1.  If the command is clear, extract the relevant information.
2.  `quantity` should be an integer. If not specified, default to null.
3.  If the command is ambiguous, nonsensical, or not a logistics command, set "action" to "UNKNOWN" and "valid_command" to false.
4.  If a field is not mentioned in the command, its value in the JSON should be null.
5.  ALWAYS respond with only a valid JSON object and nothing else.

User command: "{user_command}"

JSON response:
"""

# --- API Endpoint ---
@app.post("/parse-command", response_model=ParsedCommandResponse)
async def parse_command(request: CommandRequest):
    """
    Parses a natural language command and returns a structured JSON object.
    """
    user_command = request.command
    
    if not user_command:
        raise HTTPException(status_code=400, detail="Command string cannot be empty.")

    # Format the prompt with the user's command
    formatted_prompt = PROMPT_TEMPLATE.format(user_command=user_command)

    try:
        # Call the OpenAI API
        completion = client.chat.completions.create(
            model="o4-mini",  # Good model for JSON mode
            messages=[
                {"role": "system", "content": "You are a helpful assistant designed to output JSON."},
                {"role": "user", "content": formatted_prompt}
            ],
            response_format={"type": "json_object"} # Enable JSON mode
        )
        
        response_content = completion.choices[0].message.content
        
        # The response should be a JSON string, so we parse it
        parsed_json = json.loads(response_content)
        
        # Validate and return the response
        return ParsedCommandResponse(**parsed_json)

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM returned invalid JSON.")
    except Exception as e:
        # Catch any other potential errors from the API call
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# --- To run the app locally ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)