const _ = require('lodash');

function uid() {
    const letters = 'abcdefghijklmnopqrstuvwxyz' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const allowedChars = '0123456789' + letters;
    const NUMBER_OF_CODEPOINTS = allowedChars.length;
    const CODESIZE = 11;
    let uid;
    uid = letters.charAt(Math.random() * letters.length);
    for (let i = 1; i < CODESIZE; ++i) {
        uid += allowedChars.charAt(Math.random() * NUMBER_OF_CODEPOINTS);
    }
    return uid;
}

async function getIndexFromObjectArray(array, key, value) {
    return _.findIndex(array, data => data[key] === value);
}

async function getHttpAuthorizationHeader(username, password) {
    return {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + new Buffer.from(`${username}:${password}`).toString('base64')
    };
}

function getDhis2ValueFromCommcareValues(mappingObject, dataObject) {
    let dhis2Values = [];
    try {
        const {
            commcareVariable,
            optionSet,
            id,
            ids,
            multipleOptionSet,
            isLocation,
            isDate
        } = mappingObject;
        const commcareValue = `${dataObject[commcareVariable]}`;
        if (commcareValue) {
            if (ids) {
                selectedIds = _.filter(
                    _.map(
                        _.map(commcareValue.split(' '), value => value.trim()),
                        value => {
                            return multipleOptionSet && multipleOptionSet[value] ?
                                multipleOptionSet[value] :
                                '';
                        }
                    ),
                    selectedId => selectedId.trim() !== ''
                );
                dhis2Values = _.map(ids, id => {
                    return { id, value: _.indexOf(selectedIds, id) > -1 ? true : '' };
                });
            } else {
                if (isLocation) {
                    var locationArray = _.split(commcareValue, ' ', 2);
                    if (locationArray.length > 1) {
                        const lat = parseFloat(locationArray[1]).toFixed(6);
                        const lng = parseFloat(locationArray[0]).toFixed(6);
                        const newCoordinate = `[${lat},${lng}]`;
                        dhis2Values = [{ id, value: newCoordinate }];
                    }
                } else if (isDate) {
                    dhis2Values = [{ id, value: getFormattedDate(commcareValue) }];
                } else {
                    const value = optionSet ?
                        optionSet.hasOwnProperty(commcareValue) ?
                        optionSet[commcareValue] :
                        '' :
                        commcareValue;
                    dhis2Values = [{ id, value }];
                }
            }
        }
    } catch (error) {
        console.log(
            JSON.stringify({ error, type: 'getDhis2ValueFromCommcareValues' })
        );
    }

    return _.flattenDeep(dhis2Values);
}

function getFormattedDate(date) {
    let dateObject = new Date(date);
    if (isNaN(dateObject.getDate())) {
        dateObject = new Date();
    }
    const day = dateObject.getDate();
    const month = dateObject.getMonth() + 1;
    const year = dateObject.getFullYear();
    return (
        year +
        (month > 9 ? `-${month}` : `-0${month}`) +
        (day > 9 ? `-${day}` : `-0${day}`)
    );
}

async function getCommcarePaginations(httpResponse, limit) {
    const filters = [];
    limit = limit || 500;
    if (httpResponse && httpResponse.hasOwnProperty('meta')) {
        const { meta } = httpResponse;
        if (meta.hasOwnProperty('total_count')) {
            const { total_count } = meta;
            for (let i = 0; i <= total_count; i = i + limit) {
                filters.push(`?limit=${limit}&offset=${i}`);
            }
        }
    }
    return filters;
}

async function getNextDay(date, numberOfDays = 1) {
    const currentDay = date ? new Date(date) : new Date();
    const nextDay = new Date(currentDay);
    nextDay.setDate(currentDay.getDate() + numberOfDays);
    return getFormattedDate(nextDay);
}

async function getPrevioustDay(date, numberOfDays = 1) {
    const currentDay = date ? new Date(date) : new Date();
    const previousDay = new Date(currentDay);
    previousDay.setDate(currentDay.getDate() - numberOfDays);
    return getFormattedDate(previousDay);
}

function getOuNameFromCommCareObject(ouNameKeys, dataObject) {
    let ouName = '';
    for (const ouNameKey of ouNameKeys) {
        ouName = dataObject[ouNameKey] || ouName;
    }
    return ouName;
}

function getCommonProfileDataProperties(registrationConfig, data) {
    const enrollmentDate =
        data && registrationConfig && data[registrationConfig.enrollmentDate] ?
        data[registrationConfig.enrollmentDate] :
        data && data.date_opened ?
        data.date_opened :
        '';
    const incidentDate =
        data && registrationConfig && data[registrationConfig.incidentDate] ?
        data[registrationConfig.incidentDate] :
        data && data.date_opened ?
        data.date_opened :
        '';
    const formId = data.formId;
    return {
        formId,
        enrollmentDate: getFormattedDate(enrollmentDate),
        incidentDate: getFormattedDate(incidentDate)
    };
}

function getSanizedKeyValuePairObject(object, dataArrayKey) {
    const sanizitedObject = {};
    const keyValuePairs = _.flattenDeep(
        _.map(_.keys(object), key => {
            const value = object[key];
            const keyPair = getSanitizedValueAndKey(key, value, dataArrayKey);
            return keyPair;
        })
    );
    for (const keyValuePair of keyValuePairs) {
        const { key, value } = keyValuePair;
        sanizitedObject[key] = value;
    }
    return sanizitedObject;
}

function getSanitizedValueAndKey(key, value, dataArrayKey) {
    if (dataArrayKey && key === dataArrayKey) {
        const newValue = !Array.isArray(value) ? [value] : value;
        return { key, value: _.flattenDeep(newValue) };
    } else if (typeof value === 'object' && !Array.isArray(value)) {
        if (dataArrayKey && dataArrayKey === key) {} else {
            const newKeyPair = _.map(_.keys(value), newKey => {
                const newValue = value[newKey];
                return getSanitizedValueAndKey(`${key}.${newKey}`, newValue);
            });
            return _.flattenDeep(newKeyPair);
        }
    } else {
        return { key, value };
    }
}

module.exports = {
    uid,
    getIndexFromObjectArray,
    getHttpAuthorizationHeader,
    getNextDay,
    getFormattedDate,
    getPrevioustDay,
    getDhis2ValueFromCommcareValues,
    getCommcarePaginations,
    getOuNameFromCommCareObject,
    getCommonProfileDataProperties,
    getSanizedKeyValuePairObject
};