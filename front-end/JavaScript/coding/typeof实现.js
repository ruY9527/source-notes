function myTypeof(params){
    const type = Object.prototype.toString.call(params).slice(8, -1).toLowerCase()
    console.log(type,'type')
    const map = {
      'number': true,
      'string': true,
      'boolean': true,
      'undefined': true,
      'bigint': true,
      'symbol': true,
      'function': true
    }
    return map[type] ? type : 'object'
  }
  console.log(myTypeof([1,2]))