import InfiniteGrid, {
  InfiniteGridItemInfo, getRenderingItems,
  InfiniteGridOptions, STATUS_TYPE,
  mountRenderingItems, Renderer,
} from "../../src";
import { SampleGrid } from "./samples/SampleGrid";
import { sandbox, cleanup, waitEvent } from "./utils/utils";

describe("test cfcs", () => {
  let ig: InfiniteGrid | null;
  let container: HTMLElement | null;
  let items: InfiniteGridItemInfo[];
  beforeEach(() => {
    container = sandbox("")!;
    container!.style.cssText = "";
    items = [0, 1, 2, 3, 4, 5].map((item) => {
      return {
        key: item,
        groupKey: Math.floor(item / 3),
        html: `<div style="height: 100px;">${item}</div>`,
      };
    });
  });

  afterEach(() => {
    if (ig) {
      ig!.destroy();
    }
    ig = null;
    container = null;
    cleanup();
  });
  it("should check if rendering items exist (useFirstRender: true)", () => {
    // Given, When
    const renderingItems = getRenderingItems(items, {
      grid: null,
      horizontal: false,
      status: null,
      useFirstRender: true,
      useLoading: false,
      usePlaceholder: false,
    });

    // Then
    expect(renderingItems.length).to.be.equals(3);
  });
  it("should check if rendering items does not exist (useLoading: false)", () => {
    // Given, When
    const renderingItems = getRenderingItems(items, {
      grid: null,
      horizontal: false,
      status: null,
      useFirstRender: false,
      useLoading: false,
      usePlaceholder: false,
    });

    // Then
    expect(renderingItems.length).to.be.equals(0);
  });
  it("should check if rendering items exists with loading", async () => {
    // Given
    container!.innerHTML = `
    <div class="wrapper" style="width: 100%; height: 500px;"></div>
    `;
    const wrapper = container!.querySelector<HTMLElement>(".wrapper")!;
    ig = new InfiniteGrid<InfiniteGridOptions>(wrapper, {
      gridConstructor: SampleGrid,
      container: true,
    });
    ig.syncItems(items);
    ig.setLoading({
      html: `<div class="loading"></div>`,
    });

    await waitEvent(ig!, "renderComplete");

    // When
    ig.wait();
    await waitEvent(ig!, "renderComplete");
    const renderingItems = getRenderingItems(items, {
      grid: ig,
      horizontal: false,
      status: null,
      useFirstRender: false,
      useLoading: true,
      usePlaceholder: false,
    });

    // Then
    // 3 3 1
    expect(renderingItems.length).to.be.equals(7);
  });
  it("should check if the key is maintained every time it is updated", async () => {
    // Given
    const noKeyItems = [0, 1, 2, 3, 4, 5].map((item) => {
      return {
        html: `<div style="height: 100px;">${item}</div>`,
      };
    });
    container!.innerHTML = `
    <div class="wrapper" style="width: 100%; height: 500px;"></div>
    `;
    const wrapper = container!.querySelector<HTMLElement>(".wrapper")!;
    ig = new InfiniteGrid<InfiniteGridOptions>(wrapper, {
      gridConstructor: SampleGrid,
      container: true,
    });


    // When
    // first render
    ig.syncItems(noKeyItems);

    await waitEvent(ig!, "renderComplete");

    const renderingItems = ig.getRenderingItems();

    // second render
    ig.syncItems(noKeyItems);
    ig.renderItems();

    await waitEvent(ig!, "renderComplete");

    const renderingItems2 = ig.getRenderingItems();

    // Then
    renderingItems.forEach((item, i) => {
      const item2 = renderingItems2[i];

      expect(item.groupKey).to.be.equals(item2.groupKey);
      expect(item.key).to.be.equals(item2.key);
      expect(item.element).to.be.equals(item2.element);
    });
  });
  it("should check if rendering items exists with placeholders", async () => {
    // Given
    container!.innerHTML = `
    <div class="wrapper" style="width: 100%; height: 500px;"></div>
    `;
    const wrapper = container!.querySelector<HTMLElement>(".wrapper")!;
    ig = new InfiniteGrid<InfiniteGridOptions>(wrapper, {
      gridConstructor: SampleGrid,
      container: true,
    });
    ig.syncItems(items);
    ig.setPlaceholder({
      html: `<div class="placeholder"></div>`,
    });

    await waitEvent(ig!, "renderComplete");

    // When
    ig.wait();
    ig.appendPlaceholders(5, 4);

    await waitEvent(ig!, "renderComplete");
    const renderingItems = getRenderingItems(items, {
      grid: ig,
      horizontal: false,
      status: null,
      useFirstRender: false,
      useLoading: false,
      usePlaceholder: true,
    });

    // Then
    // 3 3 5
    expect(renderingItems.length).to.be.equals(11);
  });
  it("should check if rendering items exists with visible status", async () => {
    // Given
    container!.innerHTML = `
    <div class="wrapper" style="width: 100%; height: 500px;"></div>
    `;
    const wrapper = container!.querySelector<HTMLElement>(".wrapper")!;
    ig = new InfiniteGrid<InfiniteGridOptions>(wrapper, {
      gridConstructor: SampleGrid,
      container: true,
    });
    ig.syncItems([0, 1, 2, 3, 4, 5, 6, 7, 8].map((item) => {
      return {
        key: item,
        groupKey: Math.floor(item / 3),
        html: `<div style="height: 100px;">${item}</div>`,
      };
    }));

    await waitEvent(ig!, "renderComplete");
    // 3 3 x
    const status = ig.getStatus(STATUS_TYPE.MINIMIZE_INVISIBLE_ITEMS);

    // When
    const renderingItems = getRenderingItems(items, {
      grid: null,
      horizontal: false,
      status,
      useFirstRender: false,
      useLoading: false,
      usePlaceholder: false,
    });

    // Then
    // 3 3 5
    expect(renderingItems.length).to.be.equals(6);
  });
  it("should check whether the rendering is done even if the item is changed during status recovery", async () => {
    // Given
    container!.innerHTML = `
    <div class="wrapper" style="width: 100%; height: 500px;"></div>
    `;
    const wrapper = container!.querySelector<HTMLElement>(".wrapper")!;
    ig = new InfiniteGrid<InfiniteGridOptions>(wrapper, {
      gridConstructor: SampleGrid,
      container: true,
    });
    ig.syncItems([0, 1, 2, 3, 4, 5, 6, 7, 8].map((item) => {
      return {
        key: item,
        html: `<div style="height: 100px;">${item}</div>`,
      };
    }));

    await waitEvent(ig!, "renderComplete");

    const status = ig.getStatus();


    ig.destroy();

    const renderer = new Renderer();

    ig = new InfiniteGrid<InfiniteGridOptions>(wrapper, {
      gridConstructor: SampleGrid,
      container: true,
      renderer,
    });

    // When
    // change itmes
    const nextItems = [0, 1, 2, 3, 5, 6, 7, 8].map((item) => {
      return {
        key: item,
        html: `<div style="height: 100px;">${item}</div>`,
      };
    });

    ig.getContainerElement().innerHTML = nextItems.map((item) => item.html).join("");

    mountRenderingItems(nextItems, {
      grid: ig,
      status,
      useFirstRender: true,
      usePlaceholder: false,
      useLoading: false,
      horizontal: false,
    });

    setTimeout(() => {
      renderer.updated();
    });

    // restore
    await waitEvent(ig, "renderComplete");
    // re-render
    await waitEvent(ig, "renderComplete");


    // Then
    const children = [].slice.call(ig.getContainerElement().children);

    children.forEach((child, i) => {
      expect(child.style.top).to.be.equals(`${i * 100}px`);
    });
  });
});
