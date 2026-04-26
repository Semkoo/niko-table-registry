# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Virtualized Tables**: Fixed a critical bug where table rows would disappear when scrolling up and down, especially when using infinite scroll or when rows contain dynamic heights (like expanded states or wrapped text).
  - **Why this was added:** Previously, the virtualizer assumed every row was exactly 34px tall (`estimateSize={34}`). If actual rows were taller (e.g. due to wrapped text or expanded content), the virtualizer's total height calculations fell completely out of sync with the actual DOM. When the user scrolled down through these taller rows, the browser's scroll position would exceed the virtualizer's maximum expected scroll height, causing the virtualizer to assume the user had scrolled past all the data, resulting in it rendering a blank empty table.
  - **How it was fixed:** Added `measureElement` to the `useVirtualizer` configuration in both `DataTableVirtualizedBody` and `DataTableVirtualizedDndBody`, and explicitly attached the measurement ref to the underlying `TableRow` components (and to `VirtualizedDraggableRow` for DnD). This allows the virtualizer to dynamically measure the exact pixel height of every row as it renders and continuously update its internal calculations, keeping the scroll position perfectly in sync.
