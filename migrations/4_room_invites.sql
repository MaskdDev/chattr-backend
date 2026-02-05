create table if not exists "room_invites"
(
    -- Identification
    invite_code text primary key,
    room_id     bigint      not null,
    creator_id  text        not null,

    -- Invite information
    uses        int         not null default 0,
    max_uses    int                  default null,
    expires     timestamptz          default null,

    -- Record keeping
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),

    -- Foreign keys
    constraint fkey_room_invites_room_id foreign key (room_id)
        references "rooms" (room_id)
        on delete cascade,
    constraint fkey_room_invites_creator_id foreign key (creator_id)
        references "users" (id)
        on delete cascade
);

create trigger room_invites_set_updated_at
    before update
    on room_invites
    for each row
execute function set_updated_at();