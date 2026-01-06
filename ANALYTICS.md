# Analytics

## Problem statement
The current Analytics page looks pretty good, wanna add more statistics, not sure what to add tho.

## High level details:
- I dun know what to add haha, on top of the static data calculation, i also want to have these:
  - Add vid event
  - Watch vid event
  - Token usage
  - Search count
  - Average accuracy
  - many more
- I do know i want it to be a event driven data collection system
  - Action triggers some kind of event, it get fired to a queue
  - Async worker process it, save it somewhere
  - Another async worker process all the data, create snapshots
- I also want to view it by different time range, thats why i want snapshot, and delta event
