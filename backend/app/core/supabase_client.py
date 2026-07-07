"""Shared Supabase clients: anon key for auth calls, service-role key for
Storage access (backend bypasses Storage RLS and enforces its own
parent_id-scoped ownership checks instead — same pattern as the DB layer)."""
import os
from functools import lru_cache

from supabase import Client, create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


@lru_cache
def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


@lru_cache
def get_supabase_admin() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
