# Gruuve for Roku

A Roku channel that pairs with your Gruuve account and plays your workouts on the TV.

## Setup

1. Turn on developer mode on the Roku: press **Home ×3, Up ×2, Right, Left, Right, Left, Right** on the remote, accept the license, and set a password. Note the IP address it shows.
2. Sideload the channel:

   ```bash
   SERVER_URL=https://gruuveworkout.com \
   ROKU_IP=<roku-ip> ROKU_DEV_PASSWORD=<password> \
   ./deploy.sh
   ```

   - `SERVER_URL` is the Gruuve site the TV calls. For a local `npm run dev` server use your computer's LAN IP and port 8788, since the TV can't reach `localhost`.
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

## Publishing to the Channel Store

1. Generate a signing key on the Roku once: run `nc <roku-ip> 8080`, type `genkey`, and save the password and DevID it prints in a password manager. Every store update must be signed with this key. If you change Rokus, rekey the new one at `http://<roku-ip>/plugin_package` using a previous `.pkg` and the password.
2. Bump `build_version` (or `minor_version`) in `manifest`; the store rejects a version it already has.
3. Build, sideload and sign:

   ```bash
   SERVER_URL=https://gruuveworkout.com \
   ROKU_IP=<roku-ip> ROKU_DEV_PASSWORD=<password> ROKU_SIGN_PASSWORD=<genkey password> \
   ./deploy.sh
   ```

   This writes `build/gruuve-<version>.pkg`.
4. Upload the `.pkg` at [developer.roku.com](https://developer.roku.com) under your channel's **Package Upload**. Use `https://gruuveworkout.com/privacy` as the privacy policy URL.
