import { QRCodeSVG } from 'qrcode.react'

export default function QRCode({ value, size = 180 }) {
  return (
    <div className="inline-flex p-4 bg-ink-text rounded-lg">
      <QRCodeSVG value={value} size={size} fgColor="#12141A" bgColor="#F1EEE6" />
    </div>
  )
}
