CREATE TABLE reminders (
    r_id INTEGER PRIMARY KEY,
    r_time DATETIME NOT NULL,
    r_user VARCHAR(32) NOT NULL,
    r_channel VARCHAR(32) NOT NULL,
    r_message VARCHAR(256) NOT NULL
);