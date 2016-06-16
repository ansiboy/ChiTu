declare module QUnit {
    
    interface Assert {
        /**
         * Instruct QUnit to wait for an asynchronous operation.
         * @param acceptCallCount Number of expected callbacks before the test is done.
         */
        async(acceptCallCount?: number);
        /**
         * A deep recursive comparison, working on primitive types, arrays, objects, regular expressions, dates and functions.
         * @param actual Object or Expression being tested
         * @param expected Known comparison value
         * @param message A short description of the assertion
         */
        deepEqual(actual: any, expected: any, message?: string);
        /**
         * A non-strict comparison, roughly equivalent to JUnit's assertEquals.
         * @param actual Expression being tested
         * @param expected Known comparison value
         * @param message A short description of the assertion
         */
        equal(actual, expected, message?: string);
        /**
         * Specify how many assertions are expected to run within a test.
         * @param amount Number of assertions in this test.
         */
        expect(amount: number);
        /**
         * A non-strict comparison, checking for inequality.
         * @param actual Expression being tested
         * @param expected Known comparison value
         * @param message A short description of the assertion
         */
        notEqual(actual, expected, message?: string);
        /**
         * A boolean check, inverse of ok() and CommonJS's assert.ok(), and equivalent to JUnit's assertFalse(). Passes if the first argument is falsy.
         * @param state Expression being tested
         * @param message A short description of the assertion
         */
        notOk(state: any, message?: string)
        /**
         * A boolean check, equivalent to CommonJS's assert.ok() and JUnit's assertTrue(). Passes if the first argument is truthy.
         * @param state Expression being tested
         * @param message A short description of the assertion
         */
        ok(state: any, message);
    }

    /**
     * DEPRECATED: Add an asynchronous test to run. The test must include a call to QUnit.start().
     * @param name Title of unit being tested
     * @param callback Function to close over assertions
     */
    function asyncTest(name: string, callback: (assert: Assert) => void);
    /** 
     * Add a test to run. 
     * @param name Title of unit being tested
     * @param callback Function to close over assertions
     */
    function test(name: string, callback: (assert: Assert) => void);
}
declare module "qunit" {
    export = QUnit;
}
