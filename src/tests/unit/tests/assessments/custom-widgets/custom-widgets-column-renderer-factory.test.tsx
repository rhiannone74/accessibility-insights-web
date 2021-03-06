// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { shallow } from 'enzyme';
import * as React from 'react';

import { PropertyBagColumnRendererConfig } from '../../../../../assessments/common/property-bag-column-renderer';
import { CustomWidgetsColumnRendererFactory } from '../../../../../assessments/custom-widgets/custom-widgets-column-renderer-factory';
import { ColumnValueBag } from '../../../../../common/types/property-bag/column-value-bag';
import { AssessmentInstanceRowData } from '../../../../../DetailsView/components/assessment-instance-table';
import { RendererWrapper } from '../common/renderer-wrapper';

describe('CustomWidgetsColumnRendererFactory', () => {
    let configs: PropertyBagColumnRendererConfig<TestPropertyBag>[];
    let item: AssessmentInstanceRowData<TestPropertyBag>;

    beforeEach(() => {
        configs = [
            {
                propertyName: 'a',
                displayName: 'display a',
            },
            {
                propertyName: 'designPattern',
                displayName: 'pattern',
            },
        ];

        item = {
            instance: {
                html: null,
                target: null,
                testStepResults: null,
                propertyBag: {
                    a: 'value for a',
                    role: 'combobox',
                },
            },
            statusChoiceGroup: null,
            visualizationButton: null,
        };
    });

    it('getWithLink should render link', () => {
        const result = CustomWidgetsColumnRendererFactory.getWithLink(configs);

        checkPropertyBagAndTag(result, 'NewTabLink');
    });

    it('getWithoutLink should render text', () => {
        const result = CustomWidgetsColumnRendererFactory.getWithoutLink(configs);

        checkPropertyBagAndTag(result, 'span');
    });

    function checkPropertyBagAndTag(result: Function, tag: string): void {
        const renderer = () => result(item);

        const wrapper = shallow(<RendererWrapper render={renderer} />);

        const div = wrapper.find('.property-bag-container');
        expect(div.exists()).toBeTruthy();
        expect(div.children()).toHaveLength(2);

        const designPatternSpan = div.childAt(1);
        expect(designPatternSpan).not.toBeUndefined();
        expect(designPatternSpan.hasClass('property-bag-div')).toBeTruthy();
        expect(designPatternSpan.children()).toHaveLength(2);

        const contentElement = designPatternSpan.childAt(1).childAt(0);
        expect(contentElement.exists()).toBeTruthy();
        expect(contentElement.is(tag)).toBeTruthy();
    }
});

interface TestPropertyBag extends ColumnValueBag {
    a: string;
}
