create table if not exists "rooms"
(
    -- Identification
    room_id     bigint primary key,

    -- Room information
    name        text        not null,
    description text                 default null,

    -- Record keeping
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create trigger rooms_set_updated_at
    before update
    on rooms
    for each row
execute function set_updated_at();