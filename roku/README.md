# Gruuve for Roku

A Roku channel that pairs with your Gruuve account and plays your workouts on the TV.

## Setup

1. Turn on developer mode on the Roku: press **Home ×3, Up ×2, Right, Left, Right, Left, Right** on the remote, accept the license, and set a password. Note the IP address it shows.
2. Sideload the channel:

   ```bash
   SERVER_URL=http://<your-computer-ip>:5000 \
   WEB_URL=http://localhost:5174 \
   ROKU_IP=<roku-ip> ROKU_DEV_PASSWORD=<password> \
   ./deploy.sh
   ```

   - `SERVER_URL` is the Flask server the TV calls. It must be reachable from the TV, so use your computer's LAN IP (not `localhost`) when running locally, or the production URL.
   - `WEB_URL` is the website address shown on the pairing screen. It defaults to `SERVER_URL`.
   - Leave out `ROKU_IP` to only build `build/gruuve.zip`, which you can upload at `http://<roku-ip>` instead.

3. Open Gruuve on the TV. It shows a six-character code. Enter it on the website's **TV** page (`/tv`) and your workouts appear on the TV.

## Remote

- **OK / Play**: start, pause, resume
- **Left**: restart the current exercise
- **Right**: skip to the next exercise
- **Back**: return to the workout list
- **\***: refresh the workout list

Unpair a TV from the website's **TV** page. The TV goes back to the pairing screen the next time it loads your workouts.
