import type { MenuProps } from "antd";
import { Dropdown, Avatar } from "antd";
import { DownOutlined, UserOutlined } from "@ant-design/icons";

export default function TopHeader() {
  const items: MenuProps["items"] = [
    {
      key: 1,
      label: "退出",
    },
  ];
  return (
    <div className="flex items-center justify-between w-full text-size-16px">
      <span>首页</span>
      <div className="flex items-center gap-6">
        <Dropdown menu={{ items }} placement="bottomRight" arrow>
          <span className="cursor-pointer">欢迎admin回来 <DownOutlined className="text-size-12px" /></span>
        </Dropdown>
        <Avatar size={40} icon={<UserOutlined />}/>
      </div>
    </div>
  );
}
