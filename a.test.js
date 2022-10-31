// async function asyncPool(poolLimit, array, iteratorFn) {
//   const ret = [] // 用于存放所有的promise实例
//   const executing = [] // 用于存放目前正在执行的promise
//   for (const item of array) {
//     const p = Promise.resolve(iteratorFn(item)) // 防止回调函数返回的不是promise，使用Promise.resolve进行包裹
//     ret.push(p)
//     if (poolLimit <= array.length) {
//       // then回调中，当这个promise状态变为fulfilled后，将其从正在执行的promise列表executing中删除
//       const e = p.then(() => executing.splice(executing.indexOf(e), 1))
//       executing.push(e)
//       if (executing.length >= poolLimit) {
//         // 一旦正在执行的promise列表数量等于限制数，就使用Promise.race等待某一个promise状态发生变更，
//         // 状态变更后，就会执行上面then的回调，将该promise从executing中删除，
//         // 然后再进入到下一次for循环，生成新的promise进行补充
//         await Promise.race(executing)
//       }
//     }
//   }
//   return Promise.all(ret)
// }
// const timeout = i => {
//   console.log('开始', i)
//   return new Promise(resolve =>
//     setTimeout(() => {
//       resolve(i)
//       console.log('结束', i)
//     }, i)
//   )
// }

// ;(async () => {
//   const res = await asyncPool(2, [1000, 5000, 3000, 2000], timeout)
//   console.log(res)
// })()

const asyncPool = async (ajaxFns, limit) => {
  const res = []
  const pool = []
  for (const fn of ajaxFns) {
    const p = fn()
    res.push(p)
    if (limit < ajaxFns.length) {
      p.then(() => pool.splice(pool.indexOf(p), 1))
      pool.push(p)
      // const e = p.then(() => pool.splice(pool.indexOf(e), 1))
      // pool.push(e)
      if (pool.length === limit) {
        await Promise.race(pool)
      }
    }
  }
  return Promise.all(res)
}

const test = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const imitateAjax = i => {
  return () => {
    console.log('start --: ', i)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(i)
        console.log('end ==: ', i)
      }, (Math.random() + 1) * i * 100)
    })
  }
}
function run(params) {
  const requests = []
  for (let i = 0; i < params.length; i++) {
    requests.push(imitateAjax(test[i]))
  }
  return requests
}

asyncPool(run(test), 3).then(res => {
  console.log(res)
})
