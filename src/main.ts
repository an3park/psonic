import dgram from 'dgram'
import os from 'os'
import ip from 'ip'

const sleep = (n: number) => new Promise((r) => setTimeout(r, n))

const MDNS_MESSAGE = Buffer.from(
  '00000000000400000000000001310131033136380331393207696e2d61646472046172706100000c0001023635c00e000c0001023630c00e000c0001023539c00e000c0001',
  'hex'
)

const IPv4Interfaces = Object.values(os.networkInterfaces())
  .map((a) => a?.find((e) => e.family === 'IPv4'))
  .filter((e) => e && !e.internal) as os.NetworkInterfaceInfo[]

const udp = dgram.createSocket('udp4')

udp.on('message', (msg, rinfo) => {
  console.log(msg)

  const name = (msg.toString('ascii').match(/([\w-]+).local/i) || [])[1]
  // console.log(name)
  if (/ps\d-\w+/i.test(name)) {
    const psip = rinfo.address
    console.log('IP - ', psip)
  }
})

udp.on('listening', async () => {
  console.log('listening...', udp.address())

  await sleep(10000)

  udp.setBroadcast(true)

  setInterval(() => {
    IPv4Interfaces.forEach((i) => {
      if (!i.cidr) {
        return
      }
      const { broadcastAddress } = ip.cidrSubnet(i.cidr)

      udp.send(MDNS_MESSAGE, 5353, broadcastAddress, (err, bytes) =>
        console.log(broadcastAddress, bytes)
      )
    })
  }, 3000)
})

udp.bind()
