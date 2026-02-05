create table if not exists "room_members"
(
    -- Identification
    member_id  text        not null,
    room_id    bigint      not null,

    -- Record keeping
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Constraints
    primary key (member_id, room_id),

    -- Foreign keys
    constraint fkey_room_members_member_id foreign key (member_id)
        references "users" (id)
        on delete cascade,
    constraint fkey_room_members_room_id foreign key (room_id)
        references "rooms" (room_id)
        on delete cascade
);

create index if not exists index_room_members_room_id on "room_members" (room_id);

create trigger room_members_set_updated_at
    before update
    on room_members
    for each row
execute function set_updated_at();