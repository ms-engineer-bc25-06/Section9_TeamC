import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// 簡単なコンポーネントをテスト用に作成
function ExampleComponent() {
  return <div>Hello, Test!</div>;
}

describe('Example Component', () => {
  it('renders correctly', () => {
    render(<ExampleComponent />);
    expect(screen.getByText('Hello, Test!')).toBeInTheDocument();
  });

  it('has proper structure', () => {
    const { container } = render(<ExampleComponent />);
    expect(container.firstChild).toHaveTextContent('Hello, Test!');
  });
});
