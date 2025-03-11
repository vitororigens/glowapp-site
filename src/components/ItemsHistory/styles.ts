import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    align-items: center;
    padding: 10px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: 0.3s;

    &:hover {
        background: #f8f8f8;
    }
`;

export const ContainerIcon = styled.div`
    width: 40px;
    height: 40px;
    background: #007bff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
`;

export const ContainerText = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

export const Title = styled.h3`
    font-size: 16px;
    font-weight: bold;
    margin: 0;
`;

export const SubTitle = styled.span`
    font-size: 14px;
    color: #666;
`;

export const Divider = styled.div`
    height: 1px;
    background: #ddd;
    margin: 5px 0;
`;

export const Button = styled.button`
    background: none;
    border: none;
    cursor: pointer;
`;

export const IconCheck = styled.i`
    font-size: 24px;
    color: #007bff;

    &.checked {
        color: green;
    }

    &.unchecked {
        color: gray;
    }
`;
