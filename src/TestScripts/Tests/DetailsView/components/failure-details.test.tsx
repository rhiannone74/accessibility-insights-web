// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import * as React from 'react';

import { FailureDetails, IFailureDetailsProps } from '../../../../DetailsView/components/failure-details';

describe('FailureDetailsTests', () => {
    test('null items array', () => {
        const props: IFailureDetailsProps = {
            items: null,
        };

        const testObject = new FailureDetails(props);

        const expectedText = createExpectedSpan(`No failures were detected.`);

        const expected: JSX.Element = (
            <div className="details-message">
                {null}
                {expectedText}
            </div>
        );

        expect(testObject.render()).toEqual(expected);
    });

    test('empty items array', () => {
        const props: IFailureDetailsProps = {
            items: [],
        };

        const testObject = new FailureDetails(props);

        const expectedText = createExpectedSpan(`No failures were detected.`);

        const expected: JSX.Element = (
            <div className="details-message">
                {null}
                {expectedText}
            </div>
        );

        expect(testObject.render()).toEqual(expected);
    });

    test('one item array', () => {
        const props: IFailureDetailsProps = {
            items: ['one-item'],
        };

        const testObject = new FailureDetails(props);

        const expectedText = createExpectedSpan('1 failure was detected.');

        const expected: JSX.Element = (
            <div className="details-message">
                {createExpectedIcon()}
                {expectedText}
            </div>
        );

        expect(testObject.render()).toEqual(expected);
    });

    test('more than one item array', () => {
        const props: IFailureDetailsProps = {
            items: ['one', 'two', 'three'],
        };

        const testObject = new FailureDetails(props);

        const expectedText = createExpectedSpan(`${props.items.length} failures were detected.`);

        const expected: JSX.Element = (
            <div className="details-message">
                {createExpectedIcon()}
                {expectedText}
            </div>
        );

        expect(testObject.render()).toEqual(expected);
    });

    function createExpectedSpan(variableText: string): JSX.Element[] {
        return ([
            <span role="alert" key="at-readable-text">
                {variableText}
            </span>,
            <span key="coda-text">
                {` ${FailureDetails.failureDetailCoda}`}
            </span>,
        ]);
    }

    function createExpectedIcon(): JSX.Element {
        return <Icon iconName="statusErrorFull" className="details-icon-error" />;
    }
});

