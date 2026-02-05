create table if not exists "messages"
(
    -- Identification
    message_id     bigint primary key,
    room_id        bigint      not null,
    author_id      text        not null,

    -- Message information
    content        text        not null,
    timestamp      timestamptz not null,
    edit_timestamp timestamptz          default null,

    -- Record keeping
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),

    -- Foreign keys
    constraint fkey_messages_room_id foreign key (room_id)
        references "rooms" (room_id)
        on delete cascade,
    constraint fkey_messages_author_id foreign key (author_id)
        references "users" (id)
);

create index if not exists index_messages_room_id on "messages" (room_id);

create trigger messages_set_updated_at
    before update
    on "messages"
    for each row
execute function set_updated_at();