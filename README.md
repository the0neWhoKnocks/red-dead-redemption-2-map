# Red Dead Redemption 2 Map

A dynamic map for Red Dead Redemption 2 that allows a user to place custom 
markers with descriptions.

![rdr2-map](https://user-images.githubusercontent.com/344140/81726445-38cb0800-943c-11ea-8f90-d251ddf795a0.gif)

There are many maps online, but they:
- Require a log in
- Don't remember your settings
- Don't allow for custom user data
- Are sprinkled with ads
- Load slow

Features of this App:
- Layer settings are retained per-device after reload
- Completed items are retained
- Markers can be added by any User
- Custom sub-types for Markers can be added
- Auto-complete filtering for Markers so you can easily isolate and view groups
of Markers.
- Can toggle all layers on or off to speed up toggling just the layer(s) you
want to view.

---

## Install

Without Docker
```sh
npm i
```

With Docker
```sh
docker-compose build
```

---

## Run

Without Docker
```sh
npm start
# or for Dev (starts a BrowserSync watcher)
npm run start:dev
```

With Docker
```sh
# start
docker-compose up
# stop - CTRL+C or CMD+C
# or in another terminal
docker-compose down
```

---

## Releasing

You can simply run `./bin/release.sh` and follow the steps. Or go through
everything manually below. To skip having to enter a Docker password every time,
create a `.dockercreds` file at the root of the repo and put your password in
there.

If something happens during the final stage of the release, you'll have to
manually reset some things.
```sh
# Reset the last commit
git reset --soft HEAD~1
# Verify that just release files will be reset. You should just see:
# - `CHANGELOG.md`
# - `package-lock.json`
# - `package.json`
git status
# If the above is good, unstage those changes
git reset
# Reset changed files
git checkout -- CHANGELOG.md package.json package-lock.json
# Check if a git tag was created
git tag | cat
# If so, remove it
git tag -d <TAG_NAME>
```
