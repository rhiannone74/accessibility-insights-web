// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { CollapsibleComponent, ICollapsibleComponentProps } from '../../../../common/components/collapsible-component';

describe('CollapsibleComponentTest', () => {
    test('render expanded with content-class-name', () => {
        const props: ICollapsibleComponentProps = {
            header: <div>Some header</div>,
            content: <div>Some content</div>,
            contentClassName: 'content-class-name',
        };
        const result = Enzyme.shallow(<CollapsibleComponent {...props} />);
        expect(result.getElement()).toMatchSnapshot();
    });

    test('render expanded without content-class-name', () => {
        const props: ICollapsibleComponentProps = {
            header: <div>Some header</div>,
            content: <div>Some content</div>,
        };
        const result = Enzyme.shallow(<CollapsibleComponent {...props} />);
        expect(result.getElement()).toMatchSnapshot();
    });

    test('render with container-class-name', () => {
        const props: ICollapsibleComponentProps = {
            header: <div>Some header</div>,
            content: <div>Some content</div>,
            containerClassName: 'a-container',
        };

        const result = Enzyme.shallow(<CollapsibleComponent {...props} />);
        expect(result.getElement()).toMatchSnapshot();
    });

    test('render without container-class-name', () => {
        const props: ICollapsibleComponentProps = {
            header: <div>Some header</div>,
            content: <div>Some content</div>,
        };

        const result = Enzyme.shallow(<CollapsibleComponent {...props} />);
        expect(result.hasClass('collapsible-component')).toBe(true);
    });

    test('toggle from expaneded to collapsed', () => {
        const props: ICollapsibleComponentProps = {
            header: <div>Some header</div>,
            content: <div>Some content</div>,
        };
        const result = Enzyme.shallow(<CollapsibleComponent {...props} />);
        expect(result.getElement()).toMatchSnapshot('expaneded');
        const button = result.find('CustomizedActionButton');
        button.simulate('click');
        expect(result.getElement()).toMatchSnapshot('collapsed');
    });
});

