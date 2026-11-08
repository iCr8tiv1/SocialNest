-- Keep extension objects out of the exposed public API schema.
create schema if not exists extensions;
alter extension btree_gist set schema extensions;

-- This function is invoked only by the auth.users trigger. It must not be
-- callable as a public RPC by anonymous or signed-in clients.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
