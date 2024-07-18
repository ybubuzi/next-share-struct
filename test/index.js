const {
  Worker,
  isMainThread,
  workerData,
  parentPort,
  threadId,
} = require("worker_threads");
const CreateShareObject = require("../dev_dist/test/define-obj").default;

if (isMainThread) {
  const buffer = new SharedArrayBuffer(1024);
  const dataview = new DataView(buffer);
  dataview.setUint32(264, 10086);
  const obj = CreateShareObject(dataview);
  obj.arr = [
    {
      data: 1,
      child: {
        id: 2,
      },
    },
  ];
  const work1 = new Worker(__filename, {
    workerData: dataview,
  });

  const fn = setInterval;
  fn(() => {
    work1.postMessage("add");
  }, 50);
  const work2 = new Worker(__filename, {
    workerData: dataview,
  });
  fn(() => {
    work2.postMessage("show");
  }, 1000);
} else {
  const obj = CreateShareObject(workerData);

  parentPort.on("message", (event) => {
    switch (event) {
      case "add":
        obj.arr[0].child.id += 1;
        // console.log(
        //   `threadId: ${threadId}, obj.instace.child.id: ${obj.arr[0].child.id}`
        // );
        break;
      case "show":
        console.log(
          `threadId: ${threadId}, obj.instace.child.id: ${obj.arr[0].child.id}`
        );
        break;
    }
    // parentPort.close()
  });
}
