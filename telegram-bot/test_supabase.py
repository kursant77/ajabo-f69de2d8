import asyncio
import os
from dotenv import load_dotenv
from postgrest import AsyncPostgrestClient

async def test_conn():
    load_dotenv()
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    
    print(f"Testing connection to: {url}")
    print(f"Using key starting with: {key[:10]}...")
    
    client = AsyncPostgrestClient(
        f"{url}/rest/v1",
        headers={"apikey": key, "Authorization": f"Bearer {key}"}
    )
    
    try:
        response = await client.from_("profiles").select("*").limit(1).execute()
        print(f"Success! Data: {response.data}")
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        await client.aclose()

if __name__ == "__main__":
    asyncio.run(test_conn())
