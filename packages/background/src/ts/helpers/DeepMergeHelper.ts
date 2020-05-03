import deepmerge from 'deepmerge';

function emptyTarget(val) {
  return Array.isArray(val) ? [] : {};
}

function cloneUnlessOtherwiseSpecified(value, options) {
  return (options.clone !== false && options.isMergeableObject(value))
    ? deepmerge(emptyTarget(value), value, options)
    : value;
}

function defaultArrayMerge(target, source, options) {
  return target.concat(source).map(element => cloneUnlessOtherwiseSpecified(element, options));
}

function arrayMerge(targetArr, sourceArr, options) {
  const targetType = targetArr.length > 0 ? typeof targetArr[0] : null;
  const sourceType = sourceArr.length > 0 ? typeof sourceArr[0] : null;

  const primitiveTypes = [ 'number', 'string', 'boolean' ];
  if (primitiveTypes.includes(targetType) || primitiveTypes.includes(sourceType)) {
    const uniqueArr = new Set(targetArr.concat(sourceArr));
    return Array.from(uniqueArr);
  }

  // merge matrices, only add new rows
  if (sourceType && Array.isArray(sourceArr[0]) && targetType && Array.isArray(targetArr[0])) {
    const flattenSourceArr = sourceArr.map(nestedSourceArr => nestedSourceArr.join(''));
    const flattenTargetArr = targetArr.map(nestedTargetArr => nestedTargetArr.join(''));

    flattenSourceArr.forEach((flattenSourceElm, idx) => {
      if (!flattenTargetArr.includes(flattenSourceElm)) {
        targetArr.push(sourceArr[idx]);
      }
    });

    return targetArr;
  }

  // return the default implementation
  return defaultArrayMerge(targetArr, sourceArr, options);
}

const defaultOptions = {
  arrayMerge,
};

export default (x, y, options = {}) => deepmerge(x, y, Object.assign({}, options, defaultOptions));
