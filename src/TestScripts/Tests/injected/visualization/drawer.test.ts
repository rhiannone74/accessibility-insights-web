// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IMock, It, Mock, Times } from 'typemoq';
import { IActionN } from 'typemoq/_all';

import { WindowUtils } from '../../../../common/window-utils';
import { ClientUtils } from '../../../../injected/client-utils';
import { IHtmlElementAxeResults } from '../../../../injected/scanner-utils';
import { ShadowUtils } from '../../../../injected/shadow-utils';
import { Drawer } from '../../../../injected/visualization/drawer';
import { IDrawerInitData } from '../../../../injected/visualization/idrawer';
import { IDrawerConfiguration, IFormatter } from '../../../../injected/visualization/iformatter';
import { TestDocumentCreator } from '../../../Common/test-document-creator';
import { getDefaultFeatureFlagValues } from './../../../../common/feature-flags';
import { DrawerUtils } from './../../../../injected/visualization/drawer-utils';

describe('Drawer', () => {
    const defaultStyleStub: CSSStyleDeclaration = {
        overflowX: null,
        overflowY: null,
    } as CSSStyleDeclaration;
    const containerClass = 'drawer-test';
    let clientUtilsMock: IMock<ClientUtils>;
    let shadowUtilsMock: IMock<ShadowUtils>;
    let shadowContainer: HTMLElement;
    let windowStub: Window;
    let windowUtilsMock: IMock<WindowUtils>;
    beforeEach(() => {
        clientUtilsMock = Mock.ofType(ClientUtils);
        windowStub = { stubWindow: true } as any;
        windowUtilsMock = Mock.ofType(WindowUtils);
        shadowContainer = document.createElement('div');

        shadowUtilsMock = Mock.ofType(ShadowUtils);
        shadowUtilsMock.setup(x => x.getShadowContainer()).returns(() => shadowContainer);
    });

    test('eraseLayout called when initialize', () => {
        const eraseLayoutMock = Mock.ofInstance(() => { });
        eraseLayoutMock
            .setup(e => e())
            .verifiable(Times.once());

        const testSubject = createDrawerBuilder().build();

        (testSubject as any).eraseLayout = eraseLayoutMock.object;
        testSubject.initialize({ data: [], featureFlagStoreData: getDefaultFeatureFlagValues() });

        eraseLayoutMock.verifyAll();
    });

    test('verifyDefaultStyling', () => {
        const dom = TestDocumentCreator.createTestDocument(`
                <div id='id1'></div>
                <div id='id2'></div>
            `);

        windowUtilsMock
            .setup(it => it.getComputedStyle(It.isAny()))
            .returns(() => {
                return defaultStyleStub;
            })
            .verifiable(Times.atLeastOnce());

        const elementResults = createElementResults(['#id1', '#id2']);

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(dom)
            .setWindowUtils(windowUtilsMock.object)
            .setDrawerUtils(getDrawerUtilsMock(dom).object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        expect(testSubject.isOverlayEnabled).toEqual(false);

        testSubject.drawLayout();

        expect(testSubject.isOverlayEnabled).toEqual(true);
        const overlays = findCurrentDrawerOverlays();

        expect(overlays.length).toEqual(2);
        overlays.forEach((overlay => {
            verifyOverlayStyle(overlay);
        }));
        windowUtilsMock.verifyAll();
    });

    test('verifyDefaultStyling: visualizations fully visible in client view', () => {
        const domMock: IMock<Document> = Mock.ofInstance({
            querySelectorAll: selector => { return null; },
            createElement: selector => { return null; },
            documentElement: {
                scrollWidth: 1000,
                scrollHeight: 1000,
                clientWidth: 1000,
                clientHeight: 1000,
            },
            body: {
                scrollWidth: 1000,
                scrollHeight: 1000,
            },
            querySelector: selector => { return null; },
            appendChild: node => { },
        } as any);

        const shadowContainerMock: IMock<HTMLElement> = Mock.ofInstance({
            appendChild: child => { },
        } as any);

        shadowContainer = shadowContainerMock.object;

        const bodyStub: HTMLBodyElement = {
            scrollHeight: 1000,
            scrollWidth: 1000,
        } as any;
        const elementStub: Element = {
            clientWidth: 50,
            clientHeight: 50,
            getBoundingClientRect: () => {
                return {
                    left: 10,
                    right: 60,
                    width: 50,
                    height: 50,
                    top: 10,
                    bottom: 60,
                };
            },
        } as any;
        const elementResults = createElementResults(['#id1']);

        domMock
            .setup(it => it.querySelectorAll('#id1'))
            .returns(selector => { return [elementStub] as any; })
            .verifiable();

        domMock
            .setup(it => it.createElement('div'))
            .returns(selector => { return document.createElement(selector); })
            .verifiable(Times.exactly(3));

        domMock
            .setup(it => it.querySelector('body'))
            .returns(stuff => { return bodyStub; });

        shadowContainerMock
            .setup(it => it.appendChild(It.is((wrapper: HTMLElement) => {
                const child = wrapper.childNodes[0] as HTMLElement;
                return (
                    child.style != null &&
                    child.style.minWidth === '50px' &&
                    child.style.minHeight === '50px' &&
                    child.style.top === '10px' &&
                    child.style.left === '10px'
                );
            })))
            .verifiable();

        clientUtilsMock
            .setup(cu => cu.getOffset(elementStub))
            .returns(el => { return { left: 10, top: 10 }; });

        const windowUtilsMock = Mock.ofType(WindowUtils);

        windowUtilsMock
            .setup(it => it.getComputedStyle(bodyStub))
            .returns(stuff => {
                return {
                    overflowX: null,
                    overflowY: null,
                } as any;
            })
            .verifiable();

        windowUtilsMock
            .setup(it => it.getComputedStyle(domMock.object.documentElement as any))
            .returns(stuff => {
                return {
                    overflowX: null,
                    overflowY: null,
                } as any;
            })
            .verifiable();

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(domMock.object)
            .setClientUtils(clientUtilsMock.object)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        testSubject.drawLayout();

        domMock.verifyAll();
        windowUtilsMock.verifyAll();
        shadowContainerMock.verifyAll();
    });

    test('verifyDefaultStyling: visualizations not fully visible in client view', () => {
        const domMock: IMock<Document> = Mock.ofInstance({
            querySelectorAll: selector => { return null; },
            createElement: selector => { return null; },
            documentElement: {
                scrollWidth: 1000,
                scrollHeight: 1000,
                clientWidth: 1000,
                clientHeight: 1000,
            },
            body: {
                scrollWidth: 1000,
                scrollHeight: 1000,
            },
            querySelector: selector => { return null; },
            appendChild: node => { },
        } as any);

        const shadowContainerMock: IMock<HTMLElement> = Mock.ofInstance({
            appendChild: child => { },
        } as any);

        shadowContainer = shadowContainerMock.object;

        const bodyStub: HTMLBodyElement = {
            scrollHeight: 1000,
            scrollWidth: 1000,
        } as any;
        const elementStub: Element = {
            clientWidth: 2000,
            clientHeight: 2000,
            getBoundingClientRect: () => {
                return {
                    left: 0,
                    right: 2000,
                    width: 2000,
                    height: 2000,
                    top: 0,
                    bottom: 2000,
                };
            },
        } as any;

        const elementResults = createElementResults(['#id1']);

        domMock
            .setup(it => it.querySelectorAll('#id1'))
            .returns(selector => { return [elementStub] as any; })
            .verifiable();

        domMock
            .setup(it => it.createElement('div'))
            .returns(selector => { return document.createElement(selector); })
            .verifiable(Times.exactly(3));

        domMock
            .setup(it => it.querySelector('body'))
            .returns(stuff => { return bodyStub; });

        shadowContainerMock
            .setup(it => it.appendChild(It.is((wrapper: HTMLElement) => {
                const child = wrapper.childNodes[0] as HTMLElement;
                return (
                    child.style != null &&
                    child.style.minWidth === '990px' &&
                    child.style.minHeight === '990px' &&
                    child.style.top === '5px' &&
                    child.style.left === '5px'
                );
            })))
            .verifiable();

        clientUtilsMock
            .setup(cu => cu.getOffset(elementStub))
            .returns(_ => { return { left: 0, top: 0 }; });

        const windowUtilsMock = Mock.ofType(WindowUtils);

        windowUtilsMock
            .setup(it => it.getComputedStyle(bodyStub))
            .returns(stuff => {
                return {
                    overflowX: null,
                    overflowY: null,
                } as any;
            })
            .verifiable();

        windowUtilsMock
            .setup(it => it.getComputedStyle(domMock.object.documentElement as any))
            .returns(stuff => {
                return {
                    overflowX: null,
                    overflowY: null,
                } as any;
            })
            .verifiable();

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(domMock.object)
            .setWindowUtils(windowUtilsMock.object)
            .setClientUtils(clientUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        testSubject.drawLayout();

        domMock.verifyAll();
        shadowContainerMock.verifyAll();
        windowUtilsMock.verifyAll();
    });

    test('verifyDefaultStyling: visualizations fully not visible in client view', () => {
        const domMock: IMock<Document> = Mock.ofInstance({
            querySelectorAll: selector => { return null; },
            createElement: selector => { return null; },
            documentElement: {
                scrollWidth: 5,
                scrollHeight: 5,
                clientWidth: 5,
                clientHeight: 5,
            },
            body: {
                scrollWidth: 5,
                scrollHeight: 5,
            },
            querySelector: selector => { return null; },
            appendChild: node => { },
        } as any);

        const shadowContainerMock: IMock<HTMLElement> = Mock.ofInstance({
            appendChild: child => { },
        } as any);

        shadowContainer = shadowContainerMock.object;

        const bodyStub: HTMLBodyElement = {
            scrollHeight: 5,
            scrollWidth: 5,
        } as any;

        const elementStub: Element = {
            clientWidth: 50,
            clientHeight: 50,
            getBoundingClientRect: () => {
                return {
                    left: 10,
                    right: 60,
                    width: 50,
                    height: 50,
                    top: 10,
                    bottom: 60,
                };
            },
        } as any;

        const elementResults = createElementResults(['#id1']);

        domMock
            .setup(it => it.createElement(It.isAny()))
            .returns(
                () => {
                    return document.createElement('div');
                },
        )
            .verifiable();

        domMock
            .setup(it => it.querySelectorAll('#id1'))
            .returns(selector => { return [elementStub] as any; })
            .verifiable();

        domMock
            .setup(it => it.querySelector('body'))
            .returns(stuff => { return bodyStub; });

        shadowContainerMock
            .setup(it => it.appendChild(It.isAny()))
            .verifiable();

        clientUtilsMock
            .setup(cu => cu.getOffset(elementStub))
            .returns(_ => { return { left: 10, top: 10 }; });

        const windowUtilsMock = Mock.ofType(WindowUtils);

        windowUtilsMock
            .setup(it => it.getComputedStyle(bodyStub))
            .returns(_ => {
                return {
                    overflowX: null,
                    overflowY: null,
                } as any;
            })
            .verifiable();

        windowUtilsMock
            .setup(it => it.getComputedStyle(domMock.object.documentElement as any))
            .returns(stuff => {
                return {
                    overflowX: null,
                    overflowY: null,
                } as any;
            })
            .verifiable();

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(domMock.object)
            .setWindowUtils(windowUtilsMock.object)
            .setClientUtils(clientUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        testSubject.drawLayout();

        domMock.verifyAll();
        shadowContainerMock.verifyAll();
        windowUtilsMock.verifyAll();
    });

    test('verifyDefaultStyling: visualizations not fully visible in client view when body/html overflowX is hidden', () => {
        const domMock: IMock<Document> = Mock.ofInstance({
            querySelectorAll: selector => { return null; },
            createElement: selector => { return null; },
            documentElement: {
                scrollWidth: 1000,
                scrollHeight: 1000,
                clientWidth: 500,
                clientHeight: 1000,
            },
            body: {
                scrollWidth: 1000,
                scrollHeight: 1000,
            },
            querySelector: selector => { return null; },
            appendChild: node => { },
        } as any);

        const shadowContainerMock: IMock<HTMLElement> = Mock.ofInstance({
            appendChild: child => { },
        } as any);

        shadowContainer = shadowContainerMock.object;

        const bodyStub: HTMLBodyElement = {
            scrollHeight: 1000,
            scrollWidth: 1000,
        } as any;

        const elementStub: Element = {
            clientWidth: 2000,
            clientHeight: 2000,
            getBoundingClientRect: () => {
                return {
                    left: 0,
                    right: 2000,
                    width: 2000,
                    height: 2000,
                    top: 0,
                    bottom: 2000,
                };
            },
        } as any;

        const elementResults = createElementResults(['#id1']);

        domMock
            .setup(it => it.querySelectorAll('#id1'))
            .returns(selector => { return [elementStub] as any; })
            .verifiable();

        domMock
            .setup(it => it.createElement('div'))
            .returns(selector => { return document.createElement(selector); })
            .verifiable(Times.exactly(3));

        domMock
            .setup(it => it.querySelector('body'))
            .returns(stuff => { return bodyStub; });

        shadowContainerMock
            .setup(it => it.appendChild(It.is((wrapper: HTMLElement) => {
                const child = wrapper.childNodes[0] as HTMLElement;
                return (
                    child.style != null &&
                    child.style.minWidth === '490px' &&
                    child.style.minHeight === '990px' &&
                    child.style.top === '5px' &&
                    child.style.left === '5px'
                );
            })))
            .verifiable();

        clientUtilsMock
            .setup(cu => cu.getOffset(elementStub))
            .returns(element => { return { left: 0, top: 0 }; });

        const windowUtilsMock = Mock.ofType(WindowUtils);

        windowUtilsMock
            .setup(it => it.getComputedStyle(bodyStub))
            .returns(stuff => {
                return {
                    overflowX: null,
                    overflowY: null,
                } as any;
            })
            .verifiable();

        windowUtilsMock
            .setup(it => it.getComputedStyle(domMock.object.documentElement as any))
            .returns(stuff => {
                return {
                    overflowX: 'hidden',
                    overflowY: null,
                } as any;
            })
            .verifiable();

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(domMock.object)
            .setClientUtils(clientUtilsMock.object)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        testSubject.drawLayout();

        domMock.verifyAll();
        shadowContainerMock.verifyAll();
        windowUtilsMock.verifyAll();
    });

    test('verifyDefaultStyling: visualizations not fully visible in client view when body/html overflowY is hidden', () => {
        const domMock: IMock<Document> = Mock.ofInstance({
            querySelectorAll: selector => { return null; },
            createElement: selector => { return null; },
            documentElement: {
                scrollWidth: 1000,
                scrollHeight: 1000,
                clientWidth: 1000,
                clientHeight: 500,
            },
            body: {
                scrollWidth: 1000,
                scrollHeight: 1000,
            },
            querySelector: selector => { return null; },
            appendChild: node => { },
        } as any);

        const shadowContainerMock: IMock<HTMLElement> = Mock.ofInstance({
            appendChild: child => { },
        } as any);

        shadowContainer = shadowContainerMock.object;

        const bodyStub: HTMLBodyElement = {
            scrollHeight: 1000,
            scrollWidth: 1000,
        } as any;
        const elementStub: Element = {
            clientWidth: 2000,
            clientHeight: 2000,
            getBoundingClientRect: () => {
                return {
                    left: 0,
                    right: 2000,
                    width: 2000,
                    height: 2000,
                    top: 0,
                    bottom: 2000,
                };
            },
        } as any;

        const elementResults = createElementResults(['#id1']);

        domMock
            .setup(it => it.querySelectorAll('#id1'))
            .returns(selector => { return [elementStub] as any; })
            .verifiable();

        domMock
            .setup(it => it.createElement('div'))
            .returns(selector => { return document.createElement(selector); })
            .verifiable(Times.exactly(3));

        domMock
            .setup(it => it.querySelector('body'))
            .returns(stuff => { return bodyStub; });

        shadowContainerMock
            .setup(it => it.appendChild(It.is((wrapper: HTMLElement) => {
                const child = wrapper.childNodes[0] as HTMLElement;
                return (
                    child.style != null &&
                    child.style.minWidth === '990px' &&
                    child.style.minHeight === '490px' &&
                    child.style.top === '5px' &&
                    child.style.left === '5px'
                );
            })))
            .verifiable();

        clientUtilsMock
            .setup(cu => cu.getOffset(elementStub))
            .returns(_ => { return { left: 0, top: 0 }; });

        const windowUtilsMock = Mock.ofType(WindowUtils);

        windowUtilsMock
            .setup(it => it.getComputedStyle(bodyStub))
            .returns(stuff => {
                return {
                    overflowX: null,
                    overflowY: null,
                } as any;
            })
            .verifiable();

        windowUtilsMock
            .setup(it => it.getComputedStyle(domMock.object.documentElement as any))
            .returns(stuff => {
                return {
                    overflowX: null,
                    overflowY: 'hidden',
                } as any;
            })
            .verifiable();

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(domMock.object)
            .setClientUtils(clientUtilsMock.object)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        testSubject.drawLayout();

        domMock.verifyAll();
        shadowContainerMock.verifyAll();
        windowUtilsMock.verifyAll();
    });

    test('verify createContainerElement not called if containerElement already exists', () => {
        const domMock: IMock<Document> = Mock.ofInstance({
            querySelectorAll: selector => { return null; },
            createElement: selector => { return null; },
            documentElement: {
                scrollWidth: 1000,
                scrollHeight: 1000,
                clientWidth: 500,
                clientHeight: 1000,
            },
            body: {
                scrollWidth: 1000,
                scrollHeight: 1000,
            },
            querySelector: selector => { return null; },
            appendChild: node => { },
        } as any);

        const windowUtilsMock = Mock.ofType(WindowUtils);

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(domMock.object)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        (testSubject as any).containerElement = true;
        const createContainerElementMock = Mock.ofInstance(() => { });
        createContainerElementMock
            .setup(c => c())
            .verifiable(Times.never());
        (testSubject as any).createContainerElementMock = createContainerElementMock;

        createContainerElementMock.verifyAll();
    });

    test('verifyListenersSetupOnDraw', () => {
        const dom = TestDocumentCreator.createTestDocument(`
                <div id='id1'></div>
            `);

        setupGetComputedStyleCalled();

        const elementResults = createElementResults(['#id1']);

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(dom)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        expect(testSubject.isOverlayEnabled).toEqual(false);
        const callbacks: any[] = [];
        const registerHandlerFunc: typeof windowUtilsMock.object.addEventListener = (
            window, eventName, handler, useCapture) => callbacks.push(handler);

        // draw
        windowUtilsMock.reset();
        setupWindow();
        setupGetComputedStyleCalled();
        setupAddEventListerCalled(registerHandlerFunc);
        setupRemoveEventListerNotCalled();
        testSubject.drawLayout();

        windowUtilsMock.verifyAll();

        // erase
        windowUtilsMock.reset();
        setupWindow();
        setupAddEventListerNotCalled();
        setupRemoveEventListerCalled();

        testSubject.eraseLayout();

        windowUtilsMock.verifyAll();
        callbacks.forEach(cb => expect(cb).toEqual(callbacks[0]));
    });

    test('verifyListenersSetupOnErase', () => {
        const dom = TestDocumentCreator.createTestDocument(`
                <div id='id1'></div>
            `);

        const windowUtilsMock = Mock.ofType(WindowUtils);
        setupWindow();
        setupGetComputedStyleNotCalled();


        const elementResults = createElementResults(['#id1']);

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(dom)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        expect(testSubject.isOverlayEnabled).toEqual(false);

        // erase
        windowUtilsMock.reset();
        setupWindow();
        setupRemoveEventListerCalled();
        setupAddEventListerNotCalled();

        testSubject.eraseLayout();

        windowUtilsMock.verifyAll();
    });

    test('verifyResetTimerOnScrolling', () => {
        const dom = TestDocumentCreator.createTestDocument(`
                <div id='id1'></div>
            `);

        setupGetComputedStyleCalled();

        const elementResults = createElementResults(['#id1']);

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(dom)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        expect(testSubject.isOverlayEnabled).toEqual(false);
        let scrollCallback: Function;
        const registerHandlerFunc: typeof windowUtilsMock.object.addEventListener =
            (window, eventName, handler, useCapture) => scrollCallback = handler;

        // draw
        setupWindow();
        setupAddEventListerCalled(registerHandlerFunc);
        testSubject.drawLayout();

        // invoke scroll listener
        let timeOutCallback: Function;
        const timeOutId = 10;
        const registerTimeOutHandlerFunc: typeof window.setTimeout = (handler, timeout) => timeOutCallback = handler;

        windowUtilsMock
            .setup(x => x.clearTimeout(It.isAny()))
            .verifiable(Times.never());
        windowUtilsMock
            .setup(x => x.setTimeout(It.isAny(), Drawer.recalculationTimeout))
            .callback(registerTimeOutHandlerFunc).returns(() => timeOutId)
            .verifiable();

        scrollCallback();

        windowUtilsMock.verifyAll();

        // invoke scroll listener again (resets timer)
        windowUtilsMock.reset();

        windowUtilsMock.setup(x => x.clearTimeout(timeOutId)).verifiable();
        windowUtilsMock.setup(x => x.setTimeout(It.isAny(), Drawer.recalculationTimeout))
            .callback(registerTimeOutHandlerFunc).returns(() => timeOutId).verifiable();
        scrollCallback();

        windowUtilsMock.verifyAll();
    });

    test('verifyScrollHandlerExecution', () => {
        const dom = TestDocumentCreator.createTestDocument(`
                <div id='id1'></div>
            `);

        setupGetComputedStyleCalled();

        const elementResults = createElementResults(['#id1']);
        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(dom)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        expect(testSubject.isOverlayEnabled).toEqual(false);
        let scrollCallback: Function;
        const registerHandlerFunc: typeof windowUtilsMock.object.addEventListener =
            (window, eventName, handler, useCapture) => scrollCallback = handler;

        setupWindow();
        setupAddEventListerCalled(registerHandlerFunc);

        // draw
        testSubject.drawLayout();

        // invoke scroll listener
        let timeOutCallback: Function;
        const timeOutId = 10;
        const registerTimeOutHandlerFunc: typeof window.setTimeout = (handler, timeout) => timeOutCallback = handler;

        windowUtilsMock.setup(x => x.setTimeout(It.isAny(), Drawer.recalculationTimeout))
            .callback(registerTimeOutHandlerFunc).returns(() => timeOutId).verifiable();

        scrollCallback();

        // invoke timeout callback (should invoke draw)
        const mockDraw = Mock.ofInstance(() => { });
        mockDraw.setup(it => it()).verifiable();
        (testSubject as any).draw = mockDraw.object;
        timeOutCallback();

        mockDraw.verifyAll();
        windowUtilsMock.verifyAll();
    });

    test('verifyWhenElementResultsIsEmpty', () => {
        const dom = TestDocumentCreator.createTestDocument(`
                <div id='id1'></div>
            `);
        const elementResults = [];

        const windowUtilsMock = Mock.ofType(WindowUtils);
        windowUtilsMock
            .setup(it => it.getComputedStyle(It.isAny()))
            .returns(stuff => {
                return {
                    overflowX: null,
                    overflowY: null,
                } as any;
            })
            .verifiable(Times.never());

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(dom)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        expect(testSubject.isOverlayEnabled).toEqual(false);

        testSubject.drawLayout();
        testSubject.drawLayout();

        expect(testSubject.isOverlayEnabled).toEqual(true);
        const overlays = findCurrentDrawerOverlays();

        expect(overlays.length).toEqual(0);
        windowUtilsMock.verifyAll();
    });

    test('verifyWhenNoElementsFoundForSelectors', () => {
        const dom = TestDocumentCreator.createTestDocument(`
                <div id='id1'></div>
            `);

        const windowUtilsMock = Mock.ofType(WindowUtils);
        windowUtilsMock
            .setup(it => it.getComputedStyle(It.isAny()))
            .returns(stuff => {
                return {
                    overflowX: null,
                    overflowY: null,
                } as any;
            })
            .verifiable(Times.never());

        const elementResults = createElementResults(['#id2']);

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(dom)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));
        expect(testSubject.isOverlayEnabled).toEqual(false);

        testSubject.drawLayout();

        expect(testSubject.isOverlayEnabled).toEqual(true);
        const overlays = findCurrentDrawerOverlays();

        expect(overlays.length).toEqual(0);
        windowUtilsMock.verifyAll();
    });

    test('verifyRemoveLayout', () => {
        const dom = TestDocumentCreator.createTestDocument(`
                <div id='id1'></div>
                <div id='id2'></div>
            `);

        setupWindow();
        setupGetComputedStyleCalled();

        const elementResults = createElementResults(['#id1', '#id2']);

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(dom)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));

        const anotherDrawer = createDrawerBuilder()
            .setContainerClass('anotherDrawer')
            .setDomAndDrawerUtils(dom)
            .setWindowUtils(windowUtilsMock.object)
            .build();

        anotherDrawer.initialize(createDrawerInfo(elementResults));

        anotherDrawer.drawLayout();
        expect(findAllOverlayContainers().length).toEqual(1);

        testSubject.drawLayout();

        expect(findAllOverlayContainers().length).toEqual(2);
        testSubject.eraseLayout();

        expect(testSubject.isOverlayEnabled).toEqual(false);
        const overlays = findCurrentDrawerOverlays();

        expect(overlays.length).toEqual(0);
        expect(findAllOverlayContainers().length).toEqual(1);
        windowUtilsMock.verifyAll();
    });

    test('verifyRedraw', () => {
        const dom = TestDocumentCreator.createTestDocument(`
                <div id='id1'></div>
                <div id='id2'></div>
            `);
        const elementResults = createElementResults(['#id1', '#id2']);


        windowUtilsMock
            .setup(it => it.getComputedStyle(It.isAny()))
            .returns(() => {
                return defaultStyleStub;
            })
            .verifiable(Times.atLeastOnce());

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(dom)
            .setWindowUtils(windowUtilsMock.object)
            .setDrawerUtils(getDrawerUtilsMock(dom).object)
            .build();

        testSubject.initialize(createDrawerInfo(elementResults));

        const anotherDrawer = createDrawerBuilder()
            .setContainerClass('anotherDrawer')
            .setDomAndDrawerUtils(dom)
            .setWindowUtils(windowUtilsMock.object)
            .build();
        anotherDrawer.initialize(createDrawerInfo(elementResults));

        // draw with another drawer
        anotherDrawer.drawLayout();
        expect(findAllOverlayContainers().length).toEqual(1);

        // draw first time
        expect(testSubject.isOverlayEnabled).toEqual(false);
        testSubject.drawLayout();
        expect(testSubject.isOverlayEnabled).toEqual(true);
        expect(findAllOverlayContainers().length).toEqual(2);

        // redraw
        testSubject.drawLayout();
        expect(testSubject.isOverlayEnabled).toEqual(true);
        expect(findAllOverlayContainers().length).toEqual(2);

        const overlays = findCurrentDrawerOverlays();

        windowUtilsMock.verifyAll();
        expect(overlays.length).toEqual(4);
        overlays.forEach((overlay => {
            verifyOverlayStyle(overlay);
        }));
    });

    test('verifyFormatter', () => {
        const dom = TestDocumentCreator.createTestDocument(`
                <div id='id1'></div>
                <div id='id2'></div>
                <div id='id3'></div>
                <div id='id4'></div>
            `);

        const element1Config: IDrawerConfiguration = {
            borderColor: 'rgb(12, 13, 14)',
            textBoxConfig: {
                fontColor: 'rgb(100, 200, 0)',
                text: 'element 1 text',
                background: 'rgb(12, 13, 14)',
            },
            toolTip: 'element 1 tooltip',
            outlineStyle: 'solid',
            showVisualization: true,
        };

        const element2Config: IDrawerConfiguration = {
            textBoxConfig: {
                fontColor: 'rgb(0, 100, 0)',
                text: 'element 2 text',
                background: 'rgb(10, 1, 15)',
            },
            borderColor: 'rgb(10, 1, 15)',
            toolTip: 'element 2 tooltip',
            outlineStyle: 'dashed',
            showVisualization: true,
        };

        const element3Config: IDrawerConfiguration = {
            borderColor: 'rgb(12, 13, 14)',
            toolTip: 'element 3 tooltip',
            outlineStyle: 'solid',
            showVisualization: false,
        };

        const element4Config: IDrawerConfiguration = {
            failureBoxConfig: {
                fontColor: 'rgb(100, 200, 0)',
                text: 'element 4 text',
                background: 'rgb(12, 13, 14)',
            },
            borderColor: 'rgb(12, 13, 14)',
            toolTip: 'element 4 tooltip',
            outlineStyle: 'solid',
            showVisualization: true,
        };

        class FormatterStub implements IFormatter {
            public getDrawerConfiguration(el: Node, data): IDrawerConfiguration {
                throw new Error('Not implemented');
            }

            public getDialogRenderer() {
                return null;
            }
        }
        const formatterMock = Mock.ofType(FormatterStub);

        windowUtilsMock
            .setup(wu => wu.getComputedStyle(It.isAny()))
            .returns(() => {
                return defaultStyleStub;
            })
            .verifiable(Times.atLeastOnce());

        const elementResults = createElementResults(['#id1', '#id2', '#id3', '#id4']);

        function addMockForElement(selector: string, config: IDrawerConfiguration) {
            const elementResult = elementResults.filter(el => el.target[0] === selector)[0];
            formatterMock.setup(it => it.getDrawerConfiguration(dom.querySelector(selector), elementResult))
                .returns(() => config)
                .verifiable();
        }
        addMockForElement('#id1', element1Config);
        addMockForElement('#id2', element2Config);
        addMockForElement('#id3', element3Config);
        addMockForElement('#id4', element4Config);

        const testSubject = createDrawerBuilder()
            .setDomAndDrawerUtils(dom)
            .setFormatter(formatterMock.object)
            .setWindowUtils(windowUtilsMock.object)
            .setDrawerUtils(getDrawerUtilsMock(dom).object)
            .build();
        testSubject.initialize(createDrawerInfo(elementResults));

        testSubject.drawLayout();

        expect(testSubject.isOverlayEnabled).toEqual(true);
        formatterMock.verifyAll();

        const overlays = findCurrentDrawerOverlays();

        expect(overlays.length).toEqual(3);

        windowUtilsMock.verifyAll();
        verifyOverlayStyle(overlays[0], element1Config);
        verifyOverlayStyle(overlays[1], element2Config);
        verifyOverlayStyle(overlays[2], element4Config);
    });

    function createDrawerInfo<T>(elementResults: T[]): IDrawerInitData<T> {
        return {
            data: elementResults,
            featureFlagStoreData: getDefaultFeatureFlagValues(),
        };
    }

    function createElementResults(ids: string[]): IHtmlElementAxeResults[] {
        return ids.map(id => {
            return {
                ruleResults: {},
                target: [id],
                targetIndex: 0,
                isVisible: true,
            };
        });
    }

    function getDrawerUtilsMock(dom): IMock<DrawerUtils> {
        const drawerUtilsMock = Mock.ofType(DrawerUtils);
        drawerUtilsMock
            .setup(dm => dm.isOutsideOfDocument(It.isAny(), dom.ownerDocument, defaultStyleStub, defaultStyleStub))
            .returns(() => false)
            .verifiable(Times.atLeastOnce());
        drawerUtilsMock
            .setup(dm => dm.getDocumentElement())
            .returns(() => dom.ownerDocument)
            .verifiable(Times.atLeastOnce());
        drawerUtilsMock
            .setup(dm => dm.getContainerTopOffset(It.isAny()))
            .returns(() => 5)
            .verifiable(Times.atLeastOnce());
        drawerUtilsMock
            .setup(dm => dm.getContainerLeftOffset(It.isAny()))
            .returns(() => 5)
            .verifiable(Times.atLeastOnce());
        drawerUtilsMock
            .setup(dm => dm.getContainerWidth(It.isAny(), dom.ownerDocument, It.isAnyNumber(), defaultStyleStub, defaultStyleStub))
            .returns(() => 0)
            .verifiable(Times.atLeastOnce());
        drawerUtilsMock
            .setup(dm => dm.getContainerHeight(It.isAny(), dom.ownerDocument, It.isAnyNumber(), defaultStyleStub, defaultStyleStub))
            .returns(() => 0)
            .verifiable(Times.atLeastOnce());
        return drawerUtilsMock;
    }

    function verifyOverlayStyle(
        overlay: { container: HTMLDivElement, label: HTMLDivElement; failureLabel: HTMLDivElement },
        drawerConfig: IDrawerConfiguration = Drawer.defaultConfiguration) {
        expect(overlay.container.style.outlineStyle).toEqual(drawerConfig.outlineStyle);
        expect(overlay.container.style.outlineColor).toEqual(drawerConfig.borderColor);
        expect(overlay.container.style.top).toEqual('5px');
        expect(overlay.container.style.left).toEqual('5px');
        expect(overlay.container.style.minHeight).toEqual('0px');
        expect(overlay.container.style.minWidth).toEqual('0px');
        expect(overlay.container.title).toEqual(drawerConfig.toolTip || '');
        expect(overlay.label.style.backgroundColor).toEqual(drawerConfig.borderColor);
        expect(overlay.label.style.textAlign).toEqual(drawerConfig.textAlign || '');
        expect(overlay.label.style.cursor).toEqual(drawerConfig.cursor || '');
        if (drawerConfig.textBoxConfig) {
            expect(overlay.label.innerText).toEqual(drawerConfig.textBoxConfig.text || '');
            expect(overlay.label.style.width).toEqual(drawerConfig.textBoxConfig.boxWidth || '');
            expect(overlay.label.style.color).toEqual(drawerConfig.textBoxConfig.fontColor);
            expect(overlay.label.className).toEqual('insights-highlight-text text-label');
        }
        if (drawerConfig.failureBoxConfig) {
            expect(overlay.label.innerText).toEqual(drawerConfig.failureBoxConfig.text || '');
            expect(overlay.label.style.width).toEqual(drawerConfig.failureBoxConfig.boxWidth || '');
            expect(overlay.label.style.color).toEqual(drawerConfig.failureBoxConfig.fontColor);
            expect(overlay.label.className).toEqual('insights-highlight-text failure-label');
        }
    }

    function findCurrentDrawerOverlays(): { container: HTMLDivElement, label: HTMLDivElement; failureLabel: HTMLDivElement }[] {
        const overlays: { container: HTMLDivElement; label: HTMLDivElement; failureLabel: HTMLDivElement }[] = [];
        const containers = shadowContainer
            .querySelectorAll(`.insights-container.insights-highlight-container.${containerClass} .insights-highlight-box`);

        for (let containerPos = 0; containerPos < containers.length; containerPos++) {
            overlays.push({
                container: containers[containerPos] as HTMLDivElement,
                label: containers[containerPos].querySelector('div') as HTMLDivElement,
                failureLabel: containers[containerPos].querySelector('.failure-label') as HTMLDivElement,
            });
        }
        return overlays;
    }

    function findAllOverlayContainers() {
        return shadowContainer.querySelectorAll('.insights-container');
    }

    class DrawerBuilder {
        private dom: NodeSelector & Node;
        private containerClass: string = containerClass;
        private windowUtils: WindowUtils;
        private drawerUtils: DrawerUtils;
        private clientUtils: ClientUtils = new ClientUtils(window);
        private formatter: IFormatter;

        constructor(private readonly shadowUtils: ShadowUtils) {
            this.shadowUtils = shadowUtils;
        }

        public setClientUtils(clientUtils: ClientUtils): DrawerBuilder {
            this.clientUtils = clientUtils;
            return this;
        }

        public setWindowUtils(windowUtils: WindowUtils): DrawerBuilder {
            this.windowUtils = windowUtils;
            return this;
        }

        public setDrawerUtils(drawerUtils: DrawerUtils): DrawerBuilder {
            this.drawerUtils = drawerUtils;
            return this;
        }

        public setDomAndDrawerUtils(dom: NodeSelector & Node): DrawerBuilder {
            this.dom = dom;
            this.drawerUtils = new DrawerUtils(dom);
            return this;
        }

        public setContainerClass(cssClass: string): DrawerBuilder {
            this.containerClass = cssClass;
            return this;
        }

        public setFormatter(formatter: IFormatter): DrawerBuilder {
            this.formatter = formatter;
            return this;
        }

        public build(): Drawer {
            return new Drawer(
                this.dom,
                this.containerClass,
                this.windowUtils,
                this.shadowUtils,
                this.drawerUtils,
                this.clientUtils,
                this.formatter,
            );
        }
    }

    function createDrawerBuilder(): DrawerBuilder {
        return new DrawerBuilder(shadowUtilsMock.object);
    }

    function setupWindow() {
        windowUtilsMock
            .setup(w => w.getWindow())
            .returns((() => windowStub));
    }

    function setupGetComputedStyleNotCalled() {
        windowUtilsMock
            .setup(it => it.getComputedStyle(It.isAny()))
            .verifiable(Times.never());
    }

    function setupGetComputedStyleCalled() {
        windowUtilsMock
            .setup(it => it.getComputedStyle(It.isAny()))
            .returns(stuff => {
                return {
                    overflowX: null,
                    overflowY: null,
                } as any;
            })
            .verifiable(Times.atLeastOnce());
    }

    function setupRemoveEventListerCalled() {
        windowUtilsMock
            .setup(x => x.removeEventListener(windowStub, 'resize', It.isAny(), true))
            .verifiable();
        windowUtilsMock
            .setup(x => x.removeEventListener(windowStub, 'scroll', It.isAny(), true))
            .verifiable();
    }

    function setupRemoveEventListerNotCalled() {
        windowUtilsMock
            .setup(x => x.removeEventListener(windowStub, 'resize', It.isAny(), true))
            .verifiable(Times.never());
        windowUtilsMock
            .setup(x => x.removeEventListener(windowStub, 'scroll', It.isAny(), true))
            .verifiable(Times.never());
    }

    function setupAddEventListerCalled(callback: IActionN<any>) {
        windowUtilsMock
            .setup(x => x.addEventListener(windowStub, 'resize', It.isAny(), true))
            .callback(callback)
            .verifiable();
        windowUtilsMock
            .setup(x => x.addEventListener(windowStub, 'scroll', It.isAny(), true))
            .callback(callback)
            .verifiable();
    }

    function setupAddEventListerNotCalled() {
        windowUtilsMock
            .setup(x => x.addEventListener(windowStub, 'resize', It.isAny(), It.isAny()))
            .verifiable(Times.never());
        windowUtilsMock
            .setup(x => x.addEventListener(windowStub, 'scroll', It.isAny(), It.isAny()))
            .verifiable(Times.never());
    }
});
