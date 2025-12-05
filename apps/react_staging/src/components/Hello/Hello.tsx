import React from "react"
import { Button } from 'antd'
import { getCheckCode } from '@/api/base/base'

export default class Hello extends React.Component {
  render() {
    return (
      <div className="text-center">
        <h1>Hello, World!</h1>
        <Button type="primary" onClick={this.handleClick}>点击按钮</Button>
      </div>
    )
  }

  handleClick = () => {
    getCheckCode().then((res) => {
      console.log(res)
    })
  }
}
