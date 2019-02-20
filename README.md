# nudgebot

Nudgebot is a chatbot for Discord which will send you a reminder in a certain amount of time or at a specified time.

## Usage

All commands are prefixed with `~r`. In the future this will be configurable.

```
~r in ## [hours/hrs/minutes/mins/seconds/secs] [and ## [hrs...]] [Reminder text]

~r at ##[:##] [AM/PM] [Reminder text]
```
Schedule a new reminder. Reminder text is optional. If you omit the word "in"/"at", a best-guess attempt will be made to figure out
what you mean.

Examples of other commands that should work:
```
~r in 2 hrs and 10 mins Take out trash          <- Schedules one reminder
~r in 5 minutes and in 25 minutes Do sit ups    <- Schedules two reminders with same reminder text
~r at 0700 Wake up!                             <- 24-hour time if no ":"
~r at 5pm                                       <- Supports space/no space and capitalized/noncapitalized
```

### Other commands

```
~r list
```
Display a list of all currently scheduled reminders.

```
~r delete #
```
Delete one of your currently scheduled reminders, as numbered by `list`. For example, `~r delete 2` deletes the reminder numbered "2"

## Deployment

Nudgebot is not currently deployed for public use; if you'd like to use it for your own server, you are more than welcome to host an
instance.
