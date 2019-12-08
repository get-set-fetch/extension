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

  // return the default implementation
  return defaultArrayMerge(targetArr, sourceArr, options);
}

const defaultOptions = {
  arrayMerge,
};

export default (x, y, options = {}) => deepmerge(x, y, Object.assign({}, options, defaultOptions));
