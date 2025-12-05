import { useSelector, useDispatch } from "react-redux"
import { add, sub } from "@/features/counter/counterSlice"
import { Select, Button } from 'antd'
import { useRef } from 'react';
import type { RootState } from '@/app/store';

export default function Count() {
    const count = useSelector((state: RootState) => state.counter.count);
    const dispatch = useDispatch();
    const selectValue = useRef(1);
    
    const handleSelectChange = (value: string) => {
        selectValue.current = parseInt(value);
    }

    const handleAdd = () => {
        dispatch(add(selectValue.current));
    }
    const handleSub = () => {
        dispatch(sub(selectValue.current));
    }

    return (
        <div>
            <div className="flex items-center gap-2">
                <h1>当前求和为：{count}</h1>
                <br />
                <Select options={[
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                ]}
                    onChange={handleSelectChange}
                />
                <Button onClick={handleAdd}>+</Button>
                <Button onClick={handleSub}>-</Button>
                <Button>当前求和为奇数加</Button>
                <Button>异步加</Button>
            </div>
        </div>
    )

}
