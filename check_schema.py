import asyncio
import os
from dotenv import load_dotenv
from postgrest import AsyncPostgrestClient

async def check_schema():
    load_dotenv()
    # Path adjustment for bot's .env if needed
    env_path = os.path.join("telegram-bot", ".env")
    load_dotenv(env_path)
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("Missing credentials")
        return

    client = AsyncPostgrestClient(
        f"{url}/rest/v1",
        headers={"apikey": key, "Authorization": f"Bearer {key}"}
    )
    
    try:
        # Get one order to see keys
        response = await client.from_("orders").select("*").limit(1).execute()
        if response.data:
            print(f"Columns in 'orders': {list(response.data[0].keys())}")
        else:
            print("No data in 'orders' table to inspect.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await client.aclose()

if __name__ == "__main__":
    asyncio.run(check_schema())
