# JS-Textile

[![Made by Textile](https://img.shields.io/badge/made%20by-Textile-informational.svg?style=popout-square)](https://textile.io)
[![Chat on Slack](https://img.shields.io/badge/slack-slack.textile.io-informational.svg?style=popout-square)](https://slack.textile.io)
[![GitHub license](https://img.shields.io/github/license/textileio/js-textile.svg?style=popout-square)](./LICENSE)
![Tests](https://github.com/textileio/js-threads/workflows/Test/badge.svg)
![Review](https://github.com/textileio/js-threads/workflows/Review/badge.svg)
![Docs](https://github.com/textileio/js-threads/workflows/Docs/badge.svg)

> Typescript/Javascript libs for interacting with Textile APIs.

Go to [the docs](https://docs.textile.io/) for more about Textile.

Join us on our [public Slack channel](https://slack.textile.io/) for news, discussions, and status updates. [Check out our blog](https://medium.com/textileio) for the latest posts and announcements.

## Table of Contents

- [js-textile](#js-textile)
  - [Install](#install)
  - [Usage](#usage)
  - [Contributing](#contributing)
  - [Changelog](#changelog)
  - [License](#license)

## Install

`npm install @textile/hub`

## Usage

`@textile/hub` provides access to Textile APIs in apps based on API Keys. For details on getting keys, see [textileio/textile](https://docs.textile.io/hub/) or join the [Textile Slack](https://slack.textile.io).

## Contributing

This project is a work in progress. As such, there's a few things you can do right now to help out:

- **Ask questions**! We'll try to help. Be sure to drop a note (on the above issue) if there is anything you'd like to work on and we'll update the issue to let others know. Also [get in touch](https://slack.textile.io) on Slack.
- **Open issues**, [file issues](https://github.com/textileio/js-textile/issues), submit pull requests!
- **Perform code reviews**. More eyes will help a) speed the project along b) ensure quality and c) reduce possible future bugs.
- **Take a look at the code**. Contributions here that would be most helpful are **top-level comments** about how it should look based on your understanding. Again, the more eyes the better.
- **Add tests**. There can never be enough tests.

### Building docs

On mac, docs require gnu-sed.

```
brew install gnu-sed
```

Follow `brew info gnu-sed` instructions to make it default sed.

Install Docusaurus

```
cd website
npm install
cd ..
```

Update markdown

```
npm run docs
```

Run docs server

```
npm run serve:docs
```

## Changelog

[Changelog is published to Releases.](https://github.com/textileio/js-textile/releases)

## License

[MIT](LICENSE)
